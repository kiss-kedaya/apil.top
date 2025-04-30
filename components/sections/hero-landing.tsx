import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/shared/icons";

import EmailManagerExp from "./email";
import UrlShortenerExp from "./url-shortener";

export default async function HeroLanding() {
  const user = await getCurrentUser();
  return (
    <section className="custom-bg relative space-y-6 py-12 sm:py-20 lg:py-24">
      <div className="container flex max-w-screen-lg flex-col items-center gap-5 text-center">
        <Link
          href="/dashboard"
          target="_blank"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm", rounded: "xl" }),
            "px-4",
          )}
        >
          <span className="mr-3">🎉</span>邮箱功能&nbsp;
          <span className="font-bold" style={{ fontFamily: "Bahamas Bold" }}>
            已上线
          </span>
          &nbsp;！
        </Link>

        <h1 className="text-balance font-satoshi text-[40px] font-black leading-[1.15] tracking-tight sm:text-5xl md:text-6xl md:leading-[1.15]">
          一个平台，{" "}
          <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
            无限可能
          </span>
        </h1>

        <p className="max-w-2xl text-balance text-muted-foreground sm:text-lg">
          链接缩短、域名托管、邮件收发 <br /> 
          以及截图API，满足您构建更好产品的一切需求。
        </p>

        <div className="flex items-center justify-center gap-4">
          {/* <GitHubStarsWithSuspense
            owner="kiss-kedaya"
            repo="kedaya.xyz"
            className="shadow-sm"
          /> */}
          <Link
            href="/docs"
            prefetch={true}
            className={cn(
              buttonVariants({ rounded: "xl", size: "lg", variant: "outline" }),
              "gap-2 bg-primary-foreground px-4 text-[15px] font-semibold text-primary hover:bg-slate-100",
            )}
          >
            <span>文档</span>
            <Icons.bookOpen className="size-4" />
          </Link>
          <Link
            href="/dashboard"
            prefetch={true}
            className={cn(
              buttonVariants({ rounded: "xl", size: "lg" }),
              "px-4 text-[15px] font-semibold",
            )}
          >
            <span>{user?.id ? "控制台" : "免费注册"}</span>
            {/* <Icons.arrowRight className="size-4" /> */}
          </Link>
        </div>

        <UrlShortenerExp />
      </div>
    </section>
  );
}

export function LandingImages() {
  return (
    <>
      <div className="mx-auto mt-10 w-full max-w-6xl px-6">
        <div className="my-14 flex flex-col items-center justify-around gap-10 md:flex-row-reverse">
          <Image
            className="size-[260px] rounded-lg transition-all hover:opacity-90 hover:shadow-xl"
            alt={"example"}
            src="/_static/landing/link.svg"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxMAAAsTAQCanBgAAACCSURBVBhXZYzBCgIxDEQnTdPau+hveBB/XtiLn+NJQdoNS2Orq6zuO0zgZRhSVbvegeAJGx7hvUeMAUSEzu1RUesEKuNkIgyrFaoFzB4i8i1+cDEwXHOuRc65lbVpe38XuPm+YMdIKa3WOj9F60vWcj0IOg8Xy7ngdDxgv9vO+h/gCZNAKuSRdQ2rAAAAAElFTkSuQmCC"
            width={280}
            height={280}
          />
          <div className="grids grids-dark px-2 py-4">
            <h3 className="mb-6 text-xl font-bold md:text-3xl">
              链接缩短
            </h3>
            <p className="text-lg">
              📖 即时将冗长难记的URL转换为简短易记的链接，方便分享。享受内置分析功能，实时跟踪点击量、监控性能并获取受众洞察。
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-around gap-10 md:flex-row">
          <Image
            className="size-[260px] rounded-lg transition-all hover:opacity-90 hover:shadow-xl"
            alt={"example"}
            src="/_static/landing/hosting.svg"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxMAAAsTAQCanBgAAACCSURBVBhXZYzBCgIxDEQnTdPau+hveBB/XtiLn+NJQdoNS2Orq6zuO0zgZRhSVbvegeAJGx7hvUeMAUSEzu1RUesEKuNkIgyrFaoFzB4i8i1+cDEwXHOuRc65lbVpe38XuPm+YMdIKa3WOj9F60vWcj0IOg8Xy7ngdDxgv9vO+h/gCZNAKuSRdQ2rAAAAAElFTkSuQmCC"
            width={430}
            height={280}
          />
          <div className="grids grids-dark px-2 py-4">
            <h3 className="mb-6 text-xl font-bold md:text-3xl">
              免费子域名托管
            </h3>
            <p className="text-lg">
              🎉 通过免费、完全可定制的子域名快速启动您的在线存在。无论您是启动个人项目还是测试商业创意，都可以借助可靠的托管服务迅速免费开始。
            </p>
          </div>
        </div>

        <div className="my-14 flex flex-col items-center justify-around gap-10 md:flex-row-reverse">
          <Image
            className="size-[260px] rounded-lg transition-all hover:opacity-90 hover:shadow-xl"
            alt={"example"}
            src="/_static/landing/email.svg"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxMAAAsTAQCanBgAAACCSURBVBhXZYzBCgIxDEQnTdPau+hveBB/XtiLn+NJQdoNS2Orq6zuO0zgZRhSVbvegeAJGx7hvUeMAUSEzu1RUesEKuNkIgyrFaoFzB4i8i1+cDEwXHOuRc65lbVpe38XuPm+YMdIKa3WOj9F60vWcj0IOg8Xy7ngdDxgv9vO+h/gCZNAKuSRdQ2rAAAAAElFTkSuQmCC"
            width={450}
            height={280}
          />
          <div className="grids grids-dark px-2 py-4">
            <h3 className="mb-6 text-xl font-bold md:text-3xl">
              邮件接收与发送
            </h3>
            <p className="text-lg">
              📧 通过顶级安全性，从任何电子邮件提供商无缝接收和发送电子邮件。轻松保持联系并管理通信，同时确保您的数据受到强大加密和隐私功能的保护。
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-around gap-10 md:flex-row">
          <Image
            className="size-[260px] rounded-lg transition-all hover:opacity-90 hover:shadow-xl"
            alt={"example"}
            src="/_static/landing/domain.svg"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxMAAAsTAQCanBgAAACCSURBVBhXZYzBCgIxDEQnTdPau+hveBB/XtiLn+NJQdoNS2Orq6zuO0zgZRhSVbvegeAJGx7hvUeMAUSEzu1RUesEKuNkIgyrFaoFzB4i8i1+cDEwXHOuRc65lbVpe38XuPm+YMdIKa3WOj9F60vWcj0IOg8Xy7ngdDxgv9vO+h/gCZNAKuSRdQ2rAAAAAElFTkSuQmCC"
            width={430}
            height={280}
          />
          <div className="grids grids-dark px-2 py-4">
            <h3 className="mb-6 text-xl font-bold md:text-3xl">
              多域名支持
            </h3>
            <p className="text-lg">
              🤩 通过多域名灵活性增强您的业务，如kedaya.xyz、apil.top等。建立强大的数字足迹，创建品牌链接或管理多元化项目—全部在一个统一平台上进行。
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-around gap-10 md:flex-row-reverse">
          <Image
            className="size-[260px] rounded-lg transition-all hover:opacity-90 hover:shadow-xl"
            alt={"example"}
            src="/_static/landing/screenshot.svg"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxMAAAsTAQCanBgAAACCSURBVBhXZYzBCgIxDEQnTdPau+hveBB/XtiLn+NJQdoNS2Orq6zuO0zgZRhSVbvegeAJGx7hvUeMAUSEzu1RUesEKuNkIgyrFaoFzB4i8i1+cDEwXHOuRc65lbVpe38XuPm+YMdIKa3WOj9F60vWcj0IOg8Xy7ngdDxgv9vO+h/gCZNAKuSRdQ2rAAAAAElFTkSuQmCC"
            width={460}
            height={280}
          />
          <div className="grids grids-dark px-2 py-4">
            <h3 className="mb-6 text-xl font-bold md:text-3xl">
              网站截图API
            </h3>
            <p className="text-lg">
              📷 使用我们强大的截图API即时捕获任何网页的高质量截图。无缝集成到您的应用程序中，访问第三方服务，并通过应用您独特的API密钥解锁高级功能。
              <a
                className="underline"
                href="/dashboard/settings"
                target="_blank"
              >
                获取您的API密钥--&gt;
              </a>
            </p>
          </div>
        </div>

        <div className="my-14 flex flex-col items-center justify-around gap-10 md:flex-row">
          <Image
            className="size-[260px] rounded-lg transition-all hover:opacity-90 hover:shadow-xl"
            alt={"example"}
            src="/_static/landing/info.svg"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxMAAAsTAQCanBgAAACCSURBVBhXZYzBCgIxDEQnTdPau+hveBB/XtiLn+NJQdoNS2Orq6zuO0zgZRhSVbvegeAJGx7hvUeMAUSEzu1RUesEKuNkIgyrFaoFzB4i8i1+cDEwXHOuRc65lbVpe38XuPm+YMdIKa3WOj9F60vWcj0IOg8Xy7ngdDxgv9vO+h/gCZNAKuSRdQ2rAAAAAElFTkSuQmCC"
            width={430}
            height={280}
          />
          <div className="grids grids-dark px-2 py-4">
            <h3 className="mb-6 text-xl font-bold md:text-3xl">
              元信息API
            </h3>
            <p className="text-lg">
              🍥 使用我们智能的元信息API轻松提取丰富的结构化网页数据。这个工具非常适合开发人员、企业或研究人员，提供无缝集成、第三方服务访问和增强功能。
              <a
                className="underline"
                href="/dashboard/settings"
                target="_blank"
              >
                获取您的API密钥--&gt;
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="grids grids-dark mx-auto my-10 flex w-full max-w-6xl px-4">
        <EmailManagerExp />
      </div>
    </>
  );
}

export function CardItem({
  bgColor = "bg-yellow-400",
  rotate = "rotate-12",
  icon,
}: {
  bgColor?: string;
  rotate?: string;
  icon: ReactNode;
}) {
  return (
    <>
      <div
        className={
          `${bgColor} ${rotate}` +
          " flex h-14 w-14 cursor-pointer items-center justify-center rounded-xl text-xl transition-all hover:rotate-0 md:h-20 md:w-20"
        }
      >
        <span className="font-bold text-slate-100 md:scale-150">{icon}</span>
      </div>
    </>
  );
}
