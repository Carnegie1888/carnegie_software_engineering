(function () {
    var STORAGE_KEY = "ta_hiring_locale";
    var DEFAULT_LOCALE = "en";
    var CHINESE_LOCALE = "zh-CN";

    var dictionaries = {
        "en": {
            common: {
                portalBrand: "TA Hiring Portal",
                utility: {
                    backToPortal: "Portal home"
                },
                locale: {
                    switchAria: "Switch language",
                    zh: "中文",
                    en: "English"
                },
                action: {
                    signIn: "Sign in",
                    createAccount: "Create account",
                    createAdmin: "Create admin account"
                },
                footer: {
                    copyright: "University Hiring System © 2026"
                }
            },
            index: {
                page: {
                    title: "TA Hiring Portal - Home"
                },
                nav: {
                    aria: "Main navigation",
                    overview: "Overview",
                    forTa: "For TA",
                    forMo: "For MO",
                    forAdmin: "For Admin",
                    process: "Process",
                    faq: "FAQ"
                },
                hero: {
                    badge: "University TA Hiring Platform",
                    title: "Manage TA hiring in one clear workflow",
                    subtitle: "A single portal for teaching assistants, module organizers, and admins to register, apply, review, and track outcomes.",
                    primary: "Get started",
                    secondary: "Sign in",
                    adminHint: "Need admin access?",
                    adminLink: "Create admin account"
                },
                preview: {
                    title: "Built on real workflows, not mock slides",
                    subtitle: "The portal reflects implemented modules already available in this project.",
                    cardTaTitle: "TA workspace",
                    cardTaDesc: "Create profile, browse openings, apply, and track application status.",
                    cardMoTitle: "MO workspace",
                    cardMoDesc: "Publish jobs, review applicants, shortlist candidates, and monitor progress.",
                    cardAdminTitle: "Admin workspace",
                    cardAdminDesc: "View workload and status distribution across the hiring pipeline."
                },
                forTa: {
                    title: "For teaching assistants",
                    lead: "Everything a TA needs from profile setup to final decision tracking.",
                    item1: "Build and update your profile with resume and skills.",
                    item2: "Search and filter open TA positions by keyword and status.",
                    item3: "Submit applications and check pending, accepted, or rejected updates.",
                    cta: "Sign in as TA"
                },
                forMo: {
                    title: "For module organizers",
                    lead: "Publish openings, evaluate applicants, and close hiring loops quickly.",
                    item1: "Create postings with title, course, skills, slots, and deadline.",
                    item2: "Review applicant profiles and attached materials in one list.",
                    item3: "Accept or reject applicants while tracking overall review progress.",
                    cta: "Sign in as MO"
                },
                forAdmin: {
                    title: "For administrators",
                    lead: "Get a system-level view of workload and status distribution.",
                    item1: "Monitor active jobs, applications, and per-status breakdown.",
                    item2: "Inspect organizer workloads and key operational trends.",
                    item3: "Export workload snapshots for reporting and planning.",
                    cta: "Sign in as Admin"
                },
                process: {
                    title: "From registration to final offer",
                    lead: "The homepage mirrors the current end-to-end process in the system.",
                    step1Title: "1. Register account",
                    step1Desc: "TA/MO use standard registration. Admin uses a dedicated admin registration page.",
                    step2Title: "2. Complete profile or post job",
                    step2Desc: "TAs prepare profile details. MOs publish openings with requirements and deadlines.",
                    step3Title: "3. Apply and review",
                    step3Desc: "TAs submit applications. MOs review applicants and make selection decisions.",
                    step4Title: "4. Track status and workload",
                    step4Desc: "TAs monitor application outcomes, while admins monitor global workload statistics."
                },
                ai: {
                    title: "AI support for organizer decisions",
                    lead: "Current AI modules are available in the MO area.",
                    item1: "Skill Match compares applicants against job requirements.",
                    item2: "Missing Skills highlights capability gaps by applicant group.",
                    item3: "Use AI insights together with manual review before selecting finalists."
                },
                faq: {
                    title: "Frequently asked questions",
                    q1: "Do I need to visit this page every time?",
                    a1: "No. Returning users can open the login page directly and continue from there.",
                    q2: "Which role should I choose?",
                    a2: "Choose TA for applicants, MO for module organizers, and Admin only for platform managers.",
                    q3: "Can I switch language later?",
                    a3: "Yes. Use the top-right language switch at any time. Your choice is remembered."
                },
                cta: {
                    title: "Ready to start your TA hiring workflow?",
                    subtitle: "Use this portal for context, then jump to the sign-in flow you need.",
                    primary: "Sign in now",
                    secondary: "Create account"
                }
            },
            portal: {
                shared: {
                    signOut: "Sign Out",
                    switchRoles: "Switch Roles"
                },
                ta: {
                    ariaNav: "TA portal navigation",
                    brand: "TA Portal",
                    nav: {
                        jobs: "Jobs",
                        status: "Status",
                        aiMatch: "AI Match",
                        profile: "Profile"
                    },
                    pages: {
                        dashboard: {
                            title: "TA Profile Setup - TA Hiring System",
                            heroTitle: "Profile",
                            heroSubtitle: "Manage your personal information and academic background."
                        },
                        jobList: {
                            title: "Job list - TA Hiring System",
                            heroTitle: "Jobs",
                            heroSubtitle: "Browse and apply for open TA positions."
                        },
                        jobDetail: {
                            title: "Job detail - TA Hiring System",
                            heroTitle: "Job Detail",
                            heroSubtitle: "Review role requirements and submit your application."
                        },
                        applicationStatus: {
                            title: "Application status - TA Hiring System",
                            heroTitle: "My Applications",
                            heroSubtitle: "Track the status of your submitted applications."
                        }
                    }
                },
                mo: {
                    ariaNav: "MO portal navigation",
                    brand: "MO Portal",
                    nav: {
                        overview: "Overview",
                        applicants: "Applicants",
                        postJob: "Post Job",
                        aiMatch: "AI Match",
                        skillGaps: "Skill Gaps",
                        settings: "Settings"
                    },
                    pages: {
                        dashboard: {
                            title: "MO Dashboard - Post TA Jobs",
                            heroTitle: "Post New Job",
                            heroSubtitle: "Create a new TA position listing for your course."
                        },
                        overview: {
                            title: "MO Overview - TA Hiring System",
                            heroTitle: "Overview",
                            heroSubtitle: "Track hiring activity, then jump directly to posting and applicant review workflows."
                        },
                        applicantSelection: {
                            title: "Applicant review - TA Hiring System",
                            heroTitle: "Applicants",
                            heroSubtitle: "Review and manage all candidate applications."
                        },
                        aiMatch: {
                            title: "AI Skill Match - TA Hiring System",
                            heroTitle: "AI Skill Match",
                            heroSubtitle: "Review applicant matching scores aligned with your posted job requirements."
                        },
                        skillGaps: {
                            title: "AI Missing Skills - TA Hiring System",
                            heroTitle: "AI Missing Skills",
                            heroSubtitle: "Identify the most common capability gaps and plan targeted upskilling actions."
                        }
                    }
                },
                admin: {
                    ariaNav: "Admin portal navigation",
                    brand: "Admin Portal",
                    nav: {
                        dashboard: "Dashboard",
                        moView: "MO View",
                        aiMatch: "AI Match",
                        skillGaps: "Skill Gaps"
                    },
                    pages: {
                        dashboard: {
                            title: "Admin Workload Dashboard - TA Hiring System",
                            heroTitle: "Admin Workload Dashboard",
                            heroSubtitle: "Track application volume and module owner review workload in one place."
                        }
                    }
                }
            },
            login: {
                page: {
                    title: "Login - TA Hiring System"
                },
                hero: {
                    title: "TA Hiring Portal",
                    subtitle: "Sign in to your account"
                },
                form: {
                    aria: "Login form",
                    usernameLabel: "Username or email",
                    usernamePlaceholder: "username or name@university.edu",
                    passwordLabel: "Password",
                    passwordPlaceholder: "Enter your password",
                    forgot: "Forgot?",
                    keepSignedIn: "Keep me signed in",
                    roleAria: "Role login buttons",
                    ta: "TA Login",
                    mo: "MO Login",
                    admin: "Admin"
                },
                links: {
                    noAccount: "Don't have an account?",
                    createAccount: "Create one now",
                    needAdmin: "Need admin access?",
                    createAdmin: "Create admin account"
                },
                msg: {
                    failed: "Login failed. Please check your username and password.",
                    successRedirect: "Login successful! Redirecting...",
                    enterIdentifier: "Please enter your username or email.",
                    identifierTooLong: "Username or email is too long.",
                    identifierUnsupported: "Username or email contains unsupported characters.",
                    invalidEmail: "Please enter a valid email address.",
                    invalidUsername: "Username must start with a letter and contain 3-20 letters, numbers, or underscores.",
                    enterPassword: "Please enter your password.",
                    passwordTooShort: "Password must be at least 6 characters.",
                    passwordTooLong: "Password is too long.",
                    passwordUnsupported: "Password contains unsupported characters.",
                    networkError: "Network error. Please try again."
                }
            },
            register: {
                page: {
                    title: "Register - TA Hiring System"
                },
                hero: {
                    title: "Create your account",
                    subtitle: "Join the TA Hiring Portal in a few steps"
                },
                form: {
                    aria: "Registration form",
                    usernameLabel: "Username",
                    usernamePlaceholder: "john_smith",
                    usernameHint: "3-20 characters, start with a letter, and use only letters, numbers, or underscores.",
                    emailLabel: "Email address",
                    emailPlaceholder: "name@university.edu",
                    passwordLabel: "Password",
                    passwordPlaceholder: "Create a password",
                    passwordHint: "Use at least 6 characters.",
                    confirmLabel: "Confirm password",
                    confirmPlaceholder: "Re-enter your password",
                    roleLabel: "Register as",
                    roleAria: "Role selection buttons",
                    roleTaTitle: "TA",
                    roleTaDesc: "Applicant",
                    roleMoTitle: "MO",
                    roleMoDesc: "Module Organizer",
                    submit: "Create account"
                },
                links: {
                    haveAccount: "Already have an account?",
                    backLogin: "Back to login",
                    adminQuestion: "Registering as admin?",
                    adminLink: "Use admin registration"
                },
                msg: {
                    enterUsername: "Please enter a username.",
                    usernameTooLong: "Username is too long.",
                    usernameUnsupported: "Username contains unsupported characters.",
                    usernameInvalid: "Username must start with a letter and contain 3-20 letters, numbers, or underscores.",
                    enterEmail: "Please enter your email address.",
                    emailTooLong: "Email is too long.",
                    emailUnsupported: "Email contains unsupported characters.",
                    emailInvalid: "Please enter a valid email address.",
                    enterPassword: "Please create a password.",
                    passwordTooShort: "Password must be at least 6 characters.",
                    passwordTooLong: "Password is too long.",
                    passwordUnsupported: "Password contains unsupported characters.",
                    enterConfirmPassword: "Please confirm your password.",
                    passwordMismatch: "Passwords do not match.",
                    selectRole: "Please select a role.",
                    adminUsePage: "Please use admin registration page for Admin account.",
                    failed: "Registration failed. Please check your information and try again.",
                    successRedirect: "Registration successful! Redirecting to login...",
                    networkError: "Network error. Please try again."
                }
            },
            adminRegister: {
                page: {
                    title: "Admin Register - TA Hiring System"
                },
                hero: {
                    title: "Create admin account",
                    subtitle: "This page is only for system administrator registration"
                },
                form: {
                    aria: "Admin registration form",
                    usernamePlaceholder: "admin_username",
                    emailPlaceholder: "admin@university.edu",
                    submit: "Create admin account"
                },
                links: {
                    needStandard: "Need TA or MO account?",
                    standardLink: "Use standard registration",
                    haveAccount: "Already have an account?",
                    backLogin: "Back to login"
                }
            }
        },
        "zh-CN": {
            common: {
                portalBrand: "TA 招聘门户",
                utility: {
                    backToPortal: "返回门户首页"
                },
                locale: {
                    switchAria: "切换语言",
                    zh: "中文",
                    en: "English"
                },
                action: {
                    signIn: "登录",
                    createAccount: "创建账号",
                    createAdmin: "创建管理员账号"
                },
                footer: {
                    copyright: "University Hiring System © 2026"
                }
            },
            index: {
                page: {
                    title: "TA 招聘门户 - 首页"
                },
                nav: {
                    aria: "主导航",
                    overview: "概览",
                    forTa: "面向 TA",
                    forMo: "面向 MO",
                    forAdmin: "面向管理员",
                    process: "流程",
                    faq: "常见问题"
                },
                hero: {
                    badge: "大学 TA 招聘平台",
                    title: "用一条清晰流程管理 TA 招聘",
                    subtitle: "面向助教申请人、课程负责人和管理员的一体化门户，覆盖注册、申请、审核与结果跟踪。",
                    primary: "开始使用",
                    secondary: "前往登录",
                    adminHint: "需要管理员权限？",
                    adminLink: "创建管理员账号"
                },
                preview: {
                    title: "基于真实业务流程，而不是演示稿",
                    subtitle: "门户首页展示的内容都来自当前项目里已经实现的模块。",
                    cardTaTitle: "TA 工作台",
                    cardTaDesc: "创建档案、浏览职位、提交申请，并跟踪申请状态。",
                    cardMoTitle: "MO 工作台",
                    cardMoDesc: "发布职位、查看申请人、筛选候选人并跟踪招聘进展。",
                    cardAdminTitle: "管理员工作台",
                    cardAdminDesc: "查看招聘流程中的工作量和状态分布统计。"
                },
                forTa: {
                    title: "面向助教申请人",
                    lead: "从档案准备到录用结果，TA 全流程都可以在系统内完成。",
                    item1: "创建并维护个人档案、简历和技能信息。",
                    item2: "按关键词和状态搜索、筛选开放岗位。",
                    item3: "提交申请并跟踪待处理、通过或拒绝等状态。",
                    cta: "以 TA 身份登录"
                },
                forMo: {
                    title: "面向课程负责人（MO）",
                    lead: "快速发布岗位、评估申请人，并完成招聘闭环。",
                    item1: "发布包含课程、技能、名额和截止时间的职位。",
                    item2: "在统一列表中查看申请人档案和材料。",
                    item3: "执行录取/拒绝决策并跟踪审核进度。",
                    cta: "以 MO 身份登录"
                },
                forAdmin: {
                    title: "面向系统管理员",
                    lead: "从全局视角查看招聘工作量和处理分布。",
                    item1: "监控活跃岗位、申请总量和状态分布。",
                    item2: "查看各位 MO 的工作负载与运营趋势。",
                    item3: "导出统计快照用于汇报和规划。",
                    cta: "以管理员身份登录"
                },
                process: {
                    title: "从注册到最终录用的全流程",
                    lead: "首页展示的流程与系统当前实现的端到端能力一致。",
                    step1Title: "1. 注册账号",
                    step1Desc: "TA/MO 使用普通注册，管理员使用独立的管理员注册页。",
                    step2Title: "2. 完善档案或发布职位",
                    step2Desc: "TA 完善个人资料，MO 发布带要求和截止时间的岗位。",
                    step3Title: "3. 申请与审核",
                    step3Desc: "TA 提交申请，MO 审核候选人并做出录用决策。",
                    step4Title: "4. 跟踪状态与工作量",
                    step4Desc: "TA 跟踪申请结果，管理员跟踪平台整体工作量统计。"
                },
                ai: {
                    title: "AI 辅助招聘决策",
                    lead: "当前 AI 功能主要在 MO 工作区使用。",
                    item1: "Skill Match 可对比申请人与岗位需求的匹配度。",
                    item2: "Missing Skills 可识别候选群体的能力缺口。",
                    item3: "建议将 AI 结果与人工审核结合后再做最终筛选。"
                },
                faq: {
                    title: "常见问题",
                    q1: "每次都必须先访问这个首页吗？",
                    a1: "不需要。老用户可以直接打开登录页继续使用。",
                    q2: "我应该选择哪个角色？",
                    a2: "申请人请选择 TA，课程负责人请选择 MO，平台管理人员才选择 Admin。",
                    q3: "之后还能切换语言吗？",
                    a3: "可以。右上角可随时切换语言，系统会记住你的选择。"
                },
                cta: {
                    title: "准备好开始 TA 招聘流程了吗？",
                    subtitle: "先通过门户了解全貌，再进入你需要的登录流程。",
                    primary: "立即登录",
                    secondary: "创建账号"
                }
            },
            portal: {
                shared: {
                    signOut: "退出登录",
                    switchRoles: "切换角色"
                },
                ta: {
                    ariaNav: "TA 门户导航",
                    brand: "TA 门户",
                    nav: {
                        jobs: "职位",
                        status: "状态",
                        aiMatch: "AI 匹配",
                        profile: "档案"
                    },
                    pages: {
                        dashboard: {
                            title: "TA 档案设置 - TA 招聘系统",
                            heroTitle: "档案",
                            heroSubtitle: "管理你的个人信息和学术背景。"
                        },
                        jobList: {
                            title: "职位列表 - TA 招聘系统",
                            heroTitle: "职位",
                            heroSubtitle: "浏览并申请开放的 TA 岗位。"
                        },
                        jobDetail: {
                            title: "职位详情 - TA 招聘系统",
                            heroTitle: "职位详情",
                            heroSubtitle: "查看岗位要求并提交你的申请。"
                        },
                        applicationStatus: {
                            title: "申请状态 - TA 招聘系统",
                            heroTitle: "我的申请",
                            heroSubtitle: "跟踪你已提交申请的状态变化。"
                        }
                    }
                },
                mo: {
                    ariaNav: "MO 门户导航",
                    brand: "MO 门户",
                    nav: {
                        overview: "概览",
                        applicants: "申请人",
                        postJob: "发布职位",
                        aiMatch: "AI 匹配",
                        skillGaps: "技能缺口",
                        settings: "设置"
                    },
                    pages: {
                        dashboard: {
                            title: "MO 仪表盘 - 发布 TA 职位",
                            heroTitle: "发布新职位",
                            heroSubtitle: "为你的课程创建新的 TA 招聘岗位。"
                        },
                        overview: {
                            title: "MO 概览 - TA 招聘系统",
                            heroTitle: "概览",
                            heroSubtitle: "跟踪招聘活动，并快速进入发布和审核流程。"
                        },
                        applicantSelection: {
                            title: "申请人审核 - TA 招聘系统",
                            heroTitle: "申请人",
                            heroSubtitle: "查看并管理全部候选人的申请。"
                        },
                        aiMatch: {
                            title: "AI 技能匹配 - TA 招聘系统",
                            heroTitle: "AI 技能匹配",
                            heroSubtitle: "查看申请人与岗位需求的匹配评分。"
                        },
                        skillGaps: {
                            title: "AI 技能缺口 - TA 招聘系统",
                            heroTitle: "AI 技能缺口",
                            heroSubtitle: "识别常见能力缺口并规划提升方向。"
                        }
                    }
                },
                admin: {
                    ariaNav: "管理员门户导航",
                    brand: "管理员门户",
                    nav: {
                        dashboard: "仪表盘",
                        moView: "MO 视图",
                        aiMatch: "AI 匹配",
                        skillGaps: "技能缺口"
                    },
                    pages: {
                        dashboard: {
                            title: "管理员工作量仪表盘 - TA 招聘系统",
                            heroTitle: "管理员工作量仪表盘",
                            heroSubtitle: "在一个页面中跟踪申请量和 MO 审核负载。"
                        }
                    }
                }
            },
            login: {
                page: {
                    title: "登录 - TA 招聘系统"
                },
                hero: {
                    title: "TA 招聘门户",
                    subtitle: "登录你的账号"
                },
                form: {
                    aria: "登录表单",
                    usernameLabel: "用户名或邮箱",
                    usernamePlaceholder: "用户名 或 name@university.edu",
                    passwordLabel: "密码",
                    passwordPlaceholder: "输入你的密码",
                    forgot: "忘记密码？",
                    keepSignedIn: "保持登录状态",
                    roleAria: "角色登录按钮",
                    ta: "TA 登录",
                    mo: "MO 登录",
                    admin: "管理员"
                },
                links: {
                    noAccount: "还没有账号？",
                    createAccount: "立即注册",
                    needAdmin: "需要管理员权限？",
                    createAdmin: "创建管理员账号"
                },
                msg: {
                    failed: "登录失败，请检查用户名和密码。",
                    successRedirect: "登录成功，正在跳转...",
                    enterIdentifier: "请输入用户名或邮箱。",
                    identifierTooLong: "用户名或邮箱过长。",
                    identifierUnsupported: "用户名或邮箱包含不支持的字符。",
                    invalidEmail: "请输入有效的邮箱地址。",
                    invalidUsername: "用户名需以字母开头，长度 3-20，仅允许字母、数字和下划线。",
                    enterPassword: "请输入密码。",
                    passwordTooShort: "密码长度至少为 6 位。",
                    passwordTooLong: "密码过长。",
                    passwordUnsupported: "密码包含不支持的字符。",
                    networkError: "网络异常，请稍后重试。"
                }
            },
            register: {
                page: {
                    title: "注册 - TA 招聘系统"
                },
                hero: {
                    title: "创建账号",
                    subtitle: "几步加入 TA 招聘门户"
                },
                form: {
                    aria: "注册表单",
                    usernameLabel: "用户名",
                    usernamePlaceholder: "john_smith",
                    usernameHint: "长度 3-20，需以字母开头，仅允许字母、数字和下划线。",
                    emailLabel: "邮箱地址",
                    emailPlaceholder: "name@university.edu",
                    passwordLabel: "密码",
                    passwordPlaceholder: "创建一个密码",
                    passwordHint: "至少 6 个字符。",
                    confirmLabel: "确认密码",
                    confirmPlaceholder: "再次输入密码",
                    roleLabel: "注册身份",
                    roleAria: "角色选择按钮",
                    roleTaTitle: "TA",
                    roleTaDesc: "申请人",
                    roleMoTitle: "MO",
                    roleMoDesc: "课程负责人",
                    submit: "创建账号"
                },
                links: {
                    haveAccount: "已有账号？",
                    backLogin: "返回登录",
                    adminQuestion: "要注册管理员？",
                    adminLink: "使用管理员注册"
                },
                msg: {
                    enterUsername: "请输入用户名。",
                    usernameTooLong: "用户名过长。",
                    usernameUnsupported: "用户名包含不支持的字符。",
                    usernameInvalid: "用户名需以字母开头，长度 3-20，仅允许字母、数字和下划线。",
                    enterEmail: "请输入邮箱地址。",
                    emailTooLong: "邮箱过长。",
                    emailUnsupported: "邮箱包含不支持的字符。",
                    emailInvalid: "请输入有效的邮箱地址。",
                    enterPassword: "请创建密码。",
                    passwordTooShort: "密码长度至少为 6 位。",
                    passwordTooLong: "密码过长。",
                    passwordUnsupported: "密码包含不支持的字符。",
                    enterConfirmPassword: "请确认密码。",
                    passwordMismatch: "两次输入的密码不一致。",
                    selectRole: "请选择角色。",
                    adminUsePage: "管理员账号请使用管理员注册页面。",
                    failed: "注册失败，请检查信息后重试。",
                    successRedirect: "注册成功，正在跳转登录页...",
                    networkError: "网络异常，请稍后重试。"
                }
            },
            adminRegister: {
                page: {
                    title: "管理员注册 - TA 招聘系统"
                },
                hero: {
                    title: "创建管理员账号",
                    subtitle: "本页面仅用于系统管理员注册"
                },
                form: {
                    aria: "管理员注册表单",
                    usernamePlaceholder: "admin_username",
                    emailPlaceholder: "admin@university.edu",
                    submit: "创建管理员账号"
                },
                links: {
                    needStandard: "需要 TA 或 MO 账号？",
                    standardLink: "使用普通注册",
                    haveAccount: "已有账号？",
                    backLogin: "返回登录"
                }
            }
        }
    };

    var currentLocale = DEFAULT_LOCALE;

    function normalizeLocale(input) {
        if (typeof input !== "string" || !input.trim()) {
            return "";
        }
        var normalized = input.trim().toLowerCase();
        if (normalized === "en" || normalized.indexOf("en-") === 0) {
            return "en";
        }
        if (normalized === "zh" || normalized === "zh-cn" || normalized.indexOf("zh-") === 0) {
            return CHINESE_LOCALE;
        }
        return "";
    }

    function readSavedLocale() {
        try {
            return normalizeLocale(window.localStorage.getItem(STORAGE_KEY) || "");
        } catch (error) {
            return "";
        }
    }

    function readBrowserLocale() {
        var languages = [];
        if (Array.isArray(window.navigator.languages)) {
            languages = window.navigator.languages.slice();
        }
        if (typeof window.navigator.language === "string" && window.navigator.language) {
            languages.push(window.navigator.language);
        }
        for (var i = 0; i < languages.length; i += 1) {
            var candidate = normalizeLocale(languages[i]);
            if (candidate) {
                return candidate;
            }
        }
        return "";
    }

    function resolveInitialLocale() {
        return readSavedLocale() || readBrowserLocale() || DEFAULT_LOCALE;
    }

    function getByPath(locale, key) {
        if (!locale || !key) {
            return "";
        }
        var target = dictionaries[locale];
        if (!target) {
            return "";
        }
        var parts = key.split(".");
        var value = target;
        for (var i = 0; i < parts.length; i += 1) {
            if (!value || typeof value !== "object" || !Object.prototype.hasOwnProperty.call(value, parts[i])) {
                return "";
            }
            value = value[parts[i]];
        }
        return typeof value === "string" ? value : "";
    }

    function t(key, fallback) {
        var localized = getByPath(currentLocale, key) || getByPath(DEFAULT_LOCALE, key);
        if (localized) {
            return localized;
        }
        return typeof fallback === "string" ? fallback : key;
    }

    function rememberLocale(locale) {
        try {
            window.localStorage.setItem(STORAGE_KEY, locale);
        } catch (error) {
            // Ignore storage failures (private mode, browser policy, etc.).
        }
    }

    function updateTextContent() {
        var textNodes = document.querySelectorAll("[data-i18n]");
        Array.prototype.forEach.call(textNodes, function (node) {
            var key = node.getAttribute("data-i18n");
            if (!node.hasAttribute("data-i18n-default")) {
                node.setAttribute("data-i18n-default", node.textContent);
            }
            node.textContent = t(key, node.getAttribute("data-i18n-default") || "");
        });
    }

    function updateAttribute(selector, keyAttribute, targetAttribute, defaultStoreAttribute) {
        var nodes = document.querySelectorAll(selector);
        Array.prototype.forEach.call(nodes, function (node) {
            var key = node.getAttribute(keyAttribute);
            if (!node.hasAttribute(defaultStoreAttribute)) {
                node.setAttribute(defaultStoreAttribute, node.getAttribute(targetAttribute) || "");
            }
            node.setAttribute(targetAttribute, t(key, node.getAttribute(defaultStoreAttribute) || ""));
        });
    }

    function syncLocaleButtons() {
        var switchers = document.querySelectorAll("[data-locale-switch]");
        Array.prototype.forEach.call(switchers, function (button) {
            var buttonLocale = normalizeLocale(button.getAttribute("data-locale") || "");
            var active = buttonLocale === currentLocale;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");
        });
    }

    function applyLocale(locale, persist) {
        var normalized = normalizeLocale(locale) || DEFAULT_LOCALE;
        currentLocale = normalized;
        document.documentElement.setAttribute("lang", normalized === CHINESE_LOCALE ? CHINESE_LOCALE : "en");

        updateTextContent();
        updateAttribute("[data-i18n-placeholder]", "data-i18n-placeholder", "placeholder", "data-i18n-placeholder-default");
        updateAttribute("[data-i18n-aria-label]", "data-i18n-aria-label", "aria-label", "data-i18n-aria-label-default");
        updateAttribute("[data-i18n-title]", "data-i18n-title", "title", "data-i18n-title-default");
        updateAttribute("[data-i18n-value]", "data-i18n-value", "value", "data-i18n-value-default");
        syncLocaleButtons();

        if (persist) {
            rememberLocale(normalized);
        }

        document.dispatchEvent(new CustomEvent("app:locale-changed", { detail: { locale: normalized } }));
    }

    function bindLocaleButtons() {
        var switchers = document.querySelectorAll("[data-locale-switch]");
        Array.prototype.forEach.call(switchers, function (button) {
            button.addEventListener("click", function () {
                var targetLocale = normalizeLocale(button.getAttribute("data-locale") || "");
                if (!targetLocale || targetLocale === currentLocale) {
                    return;
                }
                applyLocale(targetLocale, true);
            });
        });
    }

    window.AppI18n = {
        t: t,
        getLocale: function () {
            return currentLocale;
        },
        setLocale: function (locale) {
            applyLocale(locale, true);
        },
        apply: function () {
            applyLocale(currentLocale, false);
        }
    };

    function initialize() {
        bindLocaleButtons();
        applyLocale(resolveInitialLocale(), false);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }
})();
