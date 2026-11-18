# Native-Crash捕获机制Linux信号处理与Breakpad移植

在现代大型 Android App 中，C/C++ 原生代码的占比越来越高。然而，相比于 Java 层的崩溃能打印详尽的类名与代码行号，**Native 层的 Crash（如野指针、内存越界、非法指令、栈溢出）往往直接表现为整个应用瞬间闪退消失（Tombstone 崩溃）**，常规的 Java `Thread.setDefaultUncaughtExceptionHandler()` 对此完全毫无感知。本文深度剖析 **Linux 信号处理机制、备用信号栈防二次崩溃、可重入信号安全函数约束，以及 Google Breakpad 原生抓栈与符号化还原实战**。

---

## 核心底层机制与全景架构

### 1. Java Crash 与 Native Crash 底层分发本质对比

```mermaid
flowchart TD
    subgraph Java 异常捕获链路
        J_Err[Java 代码发生空指针/未捕获异常] --> JVM[ART 虚拟机捕获]
        JVM --> ThreadHandler[Thread.setDefaultUncaughtExceptionHandler]
        ThreadHandler --> J_Log[打印完整 Java 调用栈并上报 APM]
    end

    subgraph Native 崩溃物理流转链路
        N_Err[C++ 代码访问野指针 0x000000] --> MMU[CPU 硬件 MMU 抛出缺页/非法访问中断]
        MMU --> Kernel[Linux 内核接收硬件中断]
        Kernel --> Signal[内核向当前出错线程发送 POSIX 信号: SIGSEGV]
        
        Signal --> CheckHandler{应用层是否通过 sigaction 注册了信号处理器?}
        CheckHandler -- 未注册 (默认处理) --> Terminate[内核直接强行杀死整个进程 (Exit Code 139)! 闪退!]
        CheckHandler -- 已注册 (Breakpad / 自研监控) --> CustomHandler[在 sigaltstack 独立备用栈执行信号捕获]
        CustomHandler --> Dump[采集 CPU 寄存器上下文并转储 Minidump 文件]
    end
```

---

## 源码级架构物理拆解

### 1. 核心 Linux 崩溃信号全景拓扑

| 信号标识 | 信号编号 | 物理成因与底层含义 | 常见业务 Bug 场景 |
| :--- | :--- | :--- | :--- |
| **`SIGSEGV`** | 11 | **Segmentation Violation（段错误）**：访问了未映射的虚拟地址空间，或尝试向只读内存写入数据 | **最常见！C++ 野指针访问、NULL 空指针解引用、数组越界** |
| **`SIGABRT`** | 6 | **Abort（异常中止）**：由进程自身调用 `abort()` 或断言失败主动引爆 | C++ `std::terminate`（未被捕获的 C++ 异常）、`assert(false)` |
| **`SIGBUS`** | 7 | **Bus Error（总线错误）**：硬件物理总线寻址异常，通常由于**内存未对齐物理访问（Memory Alignment）** | 在不支持非对齐访问的 ARM 芯片上强转不合规结构体指针 |
| **`SIGFPE`** | 8 | **Floating Point Exception（算术运算异常）** | 整数除以零、浮点溢出 |
| **`SIGILL`** | 4 | **Illegal Instruction（非法指令）** | CPU 指令集不匹配（如在不支持 NEON 的芯片执行 NEON 指令）、Inline Hook 缓存未刷新导致破损指令 |

---

### 2. 信号捕获的物理防线：`sigaction` 与备用信号栈 `sigaltstack`

通过 C 库的 `sigaction()` 系统调用可以监听上述致命信号。但有一个极其隐蔽的致命陷阱：**栈溢出崩溃（Stack Overflow）**。

#### 为什么必须开启备用信号栈？
- 如果 Native 崩溃是由**无限递归导致栈溢出（Stack Overflow）**引起的，此时当前线程的执行栈物理空间已经被彻底耗尽；
- 如果信号处理函数依然在当前的原生栈上执行，当进入信号函数的一瞬间，需要压入新的栈帧，**硬件会立即触发第二次 `SIGSEGV` 崩溃！**
- 第二次崩溃会直接击穿保护，进程被操作系统无情瞬间干掉，根本来不及生成任何排查日志！
- **物理破局（`sigaltstack`）**：在系统初始化时，预先在堆中开辟一块干净独立的内存（如 32KB），并调用 `sigaltstack()` 将其指定为“备用信号栈”。发生栈溢出时，CPU 强制切换到这块备用栈空间执行崩溃收集，确保安全避险。

```c
// 生产级初始化备用信号栈代码
static stack_t signal_stack;

void init_signal_handler() {
    // 1. 分配独立的备用栈内存
    signal_stack.ss_sp = malloc(SIGSTKSZ);
    signal_stack.ss_size = SIGSTKSZ;
    signal_stack.ss_flags = 0;
    // 2. 注册为备用信号栈
    sigaltstack(&signal_stack, NULL);

    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sa.sa_sigaction = native_crash_handler;
    // 3. 核心标志位: 强制在备用栈中执行处理函数 SA_ONSTACK
    sa.sa_flags = SA_ONSTACK | SA_SIGINFO;

    // 4. 注册所有常见致命信号
    sigaction(SIGSEGV, &sa, NULL);
    sigaction(SIGABRT, &sa, NULL);
    sigaction(SIGBUS, &sa, NULL);
    sigaction(SIGILL, &sa, NULL);
}
```

---

### 3. 严苛铁律：异步信号安全函数（Async-Signal-Safe）

在 `native_crash_handler()` 信号处理函数内部，代码执行环境处于“极度危险”的非正常状态。

- **严禁调用非异步安全函数**：
  - 严禁调用 **`malloc()` / `free()`**（底层的 `malloc_mutex` 互斥锁可能恰好在发生崩溃的瞬间被当前线程或死锁线程持有，在信号处理函数中再次 `malloc` 会直接发生**死锁（Deadlock）**）；
  - 严禁调用 **`printf()` / `pthread_mutex_lock()`**。
- **合规操作**：
  - 只能使用 Linux 内核纯系统调用：如 `write()`、`open()`、`close()` 等非缓冲且不带锁的原语函数。

---

## Google Breakpad 移植与符号化还原实战

Google 开源的 **Breakpad** 是业界 Native 监控的黄金事实标准（Chromium、Firefox、字节、微信 APM 均基于此方案衍生）：

```mermaid
flowchart LR
    Crash[发生 Native Crash] --> Handler[Breakpad 捕获信号]
    Handler --> Minidump[生成微型转储文件: crash.dmp (几KB ~ 几十KB)]
    Minidump --> Upload[上传至后端 APM 服务器]
    
    subgraph 离线符号化还原 (开发者本地环境)
        Upload --> Dmp[crash.dmp]
        Sym[带符号表的编译产物: libnative.so (未 strip)] --> DumpSym[dump_syms 工具提取 .sym 符号文件]
        Dmp --> Walk[minidump_stackwalk 工具]
        Sym --> Walk
        Walk --> Result[精确还原崩溃文件、函数名与代码行号: NativeEngine.cpp:128!]
    end
```

---

## 社招高频硬核连环追问

### Q1: 在信号处理函数捕获到 `SIGSEGV` 并上报日志后，能否直接 `return` 让程序继续若无其事地运行下去？
- **考点**：硬件缺页中断与指令重试循环。
- **解析**：
  - **绝对不能！**
  - 当 CPU 执行了一条非法内存访问指令（例如 `LDR X0, [0x00]`）时触发异常，CPU 会将程序计数器（PC 指针）停留在该行指令上；
  - 如果信号处理函数处理完后直接返回，CPU 会**再次尝试重新执行触发异常的那同一行错误指令**；
  - 结果：再次触发 `SIGSEGV`，再次进入信号函数，程序瞬间陷入死循环；
  - **唯一正确的闭环**：采集完崩溃快照后，必须通过 `sigaction` 恢复该信号的默认处理（`SIG_DFL`），或者调用 `_exit(1)` / `raise(sig)`，使进程正常终止退出。

### Q2: 生产上 Native 崩溃只拿到一串 Hex 物理地址（如 `#00 pc 00045a1c libdemo.so`），如何在没有 Breakpad 的情况下反查代码行号？
- **考点**：NDK `addr2line` 符号化排障命令。
- **解析**：
  - 利用 Android NDK 自带的工具链 `llvm-addr2line`（或 `aarch64-linux-android-addr2line`）；
  - 找到打包时留存的**未被剥离符号表（Unstripped）的带符号 SO 文件**；
  - 执行还原命令：
    ```bash
    $NDK_HOME/toolchains/llvm/prebuilt/darwin-x86_64/bin/llvm-addr2line \
      -C -f -e obj/local/arm64-v8a/libdemo.so 00045a1c
    ```
  - 终端会瞬间输出精准的 C++ 源码类名、方法名及出错的具体物理代码行号。

---

## 生产级避坑指南与排障 SOP

### 1. 解决与其他三方 SDK 的“信号处理器覆盖竞争”

**事故场景**：项目中集成了某三方监控 SDK，导致自己的 Native 崩溃捕获器偶发失效。
- **根因**：双方都调用了 `sigaction()`，后调用的 SDK 把前一个 SDK 的信号处理器覆盖抹掉了。
- **治理规范（信号链传递 Chaining）**：
  在调用 `sigaction` 时，必须保留旧的信号处理结构体 `old_sa`：
  ```c
  static struct sigaction old_sa;
  // 注册时保存旧结构体
  sigaction(SIGSEGV, &new_sa, &old_sa);

  void native_crash_handler(int sig, siginfo_t *info, void *uc) {
      // 1. 先执行自己的转储逻辑...
      dump_minidump();
      
      // 2. 关键: 执行完毕后将信号传递给上一个处理器, 避免链条断裂
      if (old_sa.sa_flags & SA_SIGINFO) {
          old_sa.sa_sigaction(sig, info, uc);
      } else if (old_sa.sa_handler != SIG_DFL && old_sa.sa_handler != SIG_IGN) {
          old_sa.sa_handler(sig);
      }
  }
  ```
