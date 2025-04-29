import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeHelp,
  BookOpen,
  BotMessageSquare,
  Bug,
  Calendar,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CirclePlay,
  Copy,
  Download,
  File,
  FileText,
  Flame,
  Globe,
  GlobeLock,
  Heading1,
  HelpCircle,
  Home,
  Image,
  Inbox,
  Laptop,
  LayoutPanelLeft,
  LineChart,
  Link,
  ListChecks,
  ListFilter,
  Loader2,
  LockKeyhole,
  LockKeyholeOpen,
  LucideIcon,
  LucideProps,
  Mail,
  MailOpen,
  MailPlus,
  MessageSquareQuote,
  MessagesSquare,
  Moon,
  MoreVertical,
  MousePointerClick,
  Package,
  Paintbrush,
  Plus,
  QrCode,
  RefreshCcw,
  RefreshCw,
  Search,
  Send,
  Settings,
  SunMedium,
  Trash2,
  Unplug,
  User,
  Users,
  X,
} from "lucide-react";

import LogoIcon from "./logo";

export type Icon = LucideIcon;

export const Icons = {
  add: Plus,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  arrowLeft: ArrowLeft,
  arrowDown: ArrowDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  bookOpen: BookOpen,
  check: Check,
  checkCheck: CheckCheck,
  close: X,
  copy: Copy,
  camera: Camera,
  calendar: Calendar,
  lock: LockKeyhole,
  unLock: LockKeyholeOpen,
  listFilter: ListFilter,
  botMessageSquare: BotMessageSquare,
  pwdKey: ({ ...props }: LucideProps) => (
    <svg
      height="18"
      width="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill="currentColor">
        <path
          d="M7.75,13.25H3.75c-1.105,0-2-.895-2-2V6.75c0-1.105,.895-2,2-2H14.25c1.105,0,2,.895,2,2v.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        ></path>
        <path
          d="M12.25,12.25v-2c0-.828,.672-1.5,1.5-1.5h0c.828,0,1.5,.672,1.5,1.5v2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        ></path>
        <circle
          cx="5.5"
          cy="9"
          fill="currentColor"
          r="1"
          stroke="none"
        ></circle>
        <circle cx="9" cy="9" fill="currentColor" r="1" stroke="none"></circle>
        <rect
          height="4"
          width="6"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          x="10.75"
          y="12.25"
        ></rect>
      </g>
    </svg>
  ),
  fileText: FileText,
  dashboard: LayoutPanelLeft,
  download: Download,
  ellipsis: MoreVertical,
  paintbrush: Paintbrush,
  mousePointerClick: MousePointerClick,
  listChecks: ListChecks,
  github: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="github"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 496 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
      ></path>
    </svg>
  ),
  google: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
      {...props}
    >
      <path
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
        fill="currentColor"
      />
    </svg>
  ),
  help: HelpCircle,
  home: Home,
  heading1: Heading1,
  qrcode: QrCode,
  laptop: Laptop,
  // lineChart: LineChart,
  logo: LogoIcon,
  media: Image,
  messages: MessagesSquare,
  messageQuoted: MessageSquareQuote,
  moon: Moon,
  page: File,
  package: Package,
  post: FileText,
  refreshCw: RefreshCw,
  search: Search,
  settings: Settings,
  spinner: Loader2,
  sun: SunMedium,
  trash: Trash2,
  inbox: Inbox,
  twitter: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="twitter"
      role="img"
      {...props}
    >
      <path
        d="M14.258 10.152L23.176 0h-2.113l-7.747 8.813L7.133 0H0l9.352 13.328L0 23.973h2.113l8.176-9.309 6.531 9.309h7.133zm-2.895 3.293l-.949-1.328L2.875 1.56h3.246l6.086 8.523.945 1.328 7.91 11.078h-3.246zm0 0"
        fill="currentColor"
      />
    </svg>
  ),
  user: User,
  users: Users,
  warning: AlertTriangle,
  globeLock: GlobeLock,
  globe: Globe,
  link: Link,
  mail: Mail,
  mailPlus: MailPlus,
  mailOpen: MailOpen,
  bug: Bug,
  CirclePlay: CirclePlay,
  unplug: Unplug,
  send: Send,
  lineChart: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m19 9-5 5-4-4-3 3" stroke="#0065ea" />
    </svg>
  ),
  outLink: ({ ...props }: LucideProps) => (
    <svg
      width="100"
      height="100"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M20 13.5001C20 14.8946 20 15.5919 19.8618 16.1673C19.4229 17.9956 17.9955 19.423 16.1672 19.8619C15.5918 20.0001 14.8945 20.0001 13.5 20.0001H12C9.19974 20.0001 7.79961 20.0001 6.73005 19.4551C5.78924 18.9758 5.02433 18.2109 4.54497 17.2701C4 16.2005 4 14.8004 4 12.0001V11.5001C4 9.17035 4 8.0055 4.3806 7.08664C4.88807 5.8615 5.86144 4.88813 7.08658 4.38066C7.86344 4.05888 8.81614 4.00915 10.5 4.00146M19.7597 9.45455C20.0221 7.8217 20.0697 6.16984 19.9019 4.54138C19.8898 4.42328 19.838 4.31854 19.7597 4.24027M19.7597 4.24027C19.6815 4.16201 19.5767 4.11023 19.4586 4.09806C17.8302 3.93025 16.1783 3.97792 14.5455 4.24027M19.7597 4.24027L10 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  ),
  discord: ({ ...props }: LucideProps) => (
    <svg
      version="1.2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1396 1070"
      width="1396"
      height="1070"
      {...props}
    >
      <defs>
        <clipPath clipPathUnits="userSpaceOnUse" id="cp1">
          <path d="m0 0h5586.5v1069.8h-5586.5z" />
        </clipPath>
        <clipPath clipPathUnits="userSpaceOnUse" id="cp2">
          <path d="m0 0h5586.5v1069.8h-5586.5z" />
        </clipPath>
      </defs>
      <g id="layer1">
        <g id="g866">
          <g id="Clip-Path: g835" clipPath="url(#cp1)">
            <g id="g835">
              <g id="Clip-Path: g833" clipPath="url(#cp2)">
                <g id="g833">
                  <path
                    id="path815"
                    fillRule="evenodd"
                    fill="#5865f2"
                    d="m1389.7 890.5c-120.8 89.5-238.1 143.8-353.3 179.3-28.6-38.7-53.8-80-75.7-123.3 41.6-15.7 81.6-35 119.4-57.6-9.9-7.3-19.7-14.9-29.2-22.8-226.9 106.3-476.5 106.3-706.1 0-9.4 7.9-19.2 15.5-29.2 22.8 37.7 22.5 77.5 41.8 119.1 57.4-21.8 43.5-47.2 84.6-75.6 123.4-115.2-35.5-232.3-89.8-353.2-179.2-24.7-262.1 24.7-528 207-800.7 90.3-41.9 187-72.5 288.1-89.8 12.5 22.2 27.3 52.1 37.3 75.8q158.1-24 319.1 0c10-23.7 24.5-53.6 36.9-75.8 101 17.3 197.6 47.7 288 89.6 157.9 233.6 236.4 497 207.4 800.9zm-798.2-302.6c0-78.2-56.1-141.4-125.5-141.4-69.4 0-125.5 63.2-125.5 141.4 0 78.2 56.1 141.4 125.5 141.4 69.4 0 125.5-63.2 125.5-141.4zm463.7 0c0-78.2-56.1-141.4-125.5-141.4-69.4 0-125.5 63.2-125.5 141.4 0 78.2 56.1 141.4 125.5 141.4 69.4 0 125.5-63.2 125.5-141.4z"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  ),
};
