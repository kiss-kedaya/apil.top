"use client";

import { useState } from "react";
import JsonView from "@uiw/react-json-view";
import { githubLightTheme } from "@uiw/react-json-view/githubLight";
import { vscodeTheme } from "@uiw/react-json-view/vscode";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BlurImage from "@/components/shared/blur-image";

export interface MetaScrapingProps {
  title: string;
  description: string;
  image: string;
  icon: string;
  url: string;
  lang: string;
  author: string;
  timestamp: string;
  payload: string;
}

export interface MarkdownScrapingProps {
  url: string;
  content: string;
  format: string;
  timestamp: string;
  payload: string;
}

export function ScreenshotScraping({
  user,
}: {
  user: { id: string; apiKey: string };
}) {
  const { theme } = useTheme();
  const [protocol, setProtocol] = useState("https://");

  const [isShoting, setIsShoting] = useState(false);
  const [currentScreenshotLink, setCurrentScreenshotLink] =
    useState("vmail.dev");
  const [screenshotInfo, setScreenshotInfo] = useState({
    tmp_url: "",
    payload: "",
  });

  const handleScrapingScreenshot = async () => {
    if (currentScreenshotLink) {
      setIsShoting(true);
      const payload = `/api/v1/scraping/screenshot?url=${protocol}${currentScreenshotLink}&key=${user.apiKey}`;
      const res = await fetch(payload);
      if (!res.ok || res.status !== 200) {
        const data = await res.json();
        toast.error(data.statusText);
      } else {
        const blob = await res.blob();
        const imageUrl = URL.createObjectURL(blob);
        setScreenshotInfo({
          tmp_url: imageUrl,
          payload: `${window.location.origin}${payload}`,
        });
        toast.success("成功！");
      }
      setIsShoting(false);
    }
  };

  return (
    <>
      <CodeLight content={`https://kedaya.xyz/api/v1/scraping/screenshot`} />
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>演示场景</CardTitle>
          <CardDescription>
            自动截取网站截图并将其转换为应用程序的精美视觉效果。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Select
              onValueChange={(value: string) => {
                setProtocol(value);
              }}
              name="protocol"
              defaultValue="https://"
            >
              <SelectTrigger className="h-10 w-24 rounded-r-none bg-transparent shadow-inner">
                <SelectValue placeholder="协议" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="https" value="https://">
                  https://
                </SelectItem>
                <SelectItem key="http" value="http://">
                  http://
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="www.example.com"
              className="h-10 rounded-none border focus:border-primary active:border-primary"
              value={currentScreenshotLink}
              size={100}
              onChange={(e) => setCurrentScreenshotLink(e.target.value)}
            />
            <Button
              variant="blue"
              onClick={handleScrapingScreenshot}
              disabled={isShoting}
              className="rounded-l-none"
            >
              {isShoting ? "抓取中..." : "发送"}
            </Button>
          </div>

          <div className="mt-4 rounded-md border p-3">
            <JsonView
              className="max-w-2xl overflow-auto p-2"
              style={theme === "dark" ? vscodeTheme : githubLightTheme}
              value={screenshotInfo}
              displayObjectSize={false}
              displayDataTypes={false}
              // shortenTextAfterLength={50}
            />
            {screenshotInfo.tmp_url && (
              <BlurImage
                src={screenshotInfo.tmp_url}
                alt="网站预览图"
                className="my-4 flex rounded-md border object-contain object-center shadow-md"
                width={1500}
                height={750}
                priority
                // placeholder="blur"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function MetaScraping({
  user,
}: {
  user: { id: string; apiKey: string };
}) {
  const { theme } = useTheme();
  const [currentLink, setCurrentLink] = useState("kedaya.xyz");
  const [protocol, setProtocol] = useState("https://");
  const [metaInfo, setMetaInfo] = useState<MetaScrapingProps>({
    title: "",
    description: "",
    image: "",
    icon: "",
    url: "",
    lang: "",
    author: "",
    timestamp: "",
    payload: "",
  });
  const [isScraping, setIsScraping] = useState(false);

  const handleScrapingMeta = async () => {
    if (currentLink) {
      setIsScraping(true);
      const res = await fetch(
        `/api/v1/scraping/meta?url=${protocol}${currentLink}&key=${user.apiKey}`,
      );
      if (!res.ok || res.status !== 200) {
        const data = await res.json();
        toast.error(data.statusText);
      } else {
        const data = await res.json();
        setMetaInfo(data);
        toast.success("成功！");
      }
      setIsScraping(false);
    }
  };

  return (
    <>
      <CodeLight content={`https://kedaya.xyz/api/v1/scraping/meta`} />
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>演示场景</CardTitle>
          <CardDescription>抓取网站的元数据信息。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Select
              onValueChange={(value: string) => {
                setProtocol(value);
              }}
              name="protocol"
              defaultValue={"https://"}
            >
              <SelectTrigger className="h-10 w-24 rounded-r-none bg-transparent shadow-inner">
                <SelectValue placeholder="协议" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="https" value="https://">
                  https://
                </SelectItem>
                <SelectItem key="http" value="http://">
                  http://
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="www.example.com"
              className="h-10 rounded-none border focus:border-primary active:border-primary"
              value={currentLink}
              size={100}
              onChange={(e) => setCurrentLink(e.target.value)}
            />
            <Button
              variant="blue"
              onClick={handleScrapingMeta}
              disabled={isScraping}
              className="rounded-l-none"
            >
              {isScraping ? "抓取中..." : "发送"}
            </Button>
          </div>

          <div className="mt-4 rounded-md border p-3">
            <JsonView
              style={theme === "dark" ? vscodeTheme : githubLightTheme}
              className="max-w-2xl overflow-auto p-2"
              value={metaInfo}
              displayObjectSize={false}
              displayDataTypes={false}
              // shortenTextAfterLength={50}
            />
            {metaInfo.image && (
              <BlurImage
                src={metaInfo.image}
                alt={metaInfo.title || "网站图片"}
                className="my-4 max-h-64 rounded-lg border shadow-sm"
                width={512}
                height={512}
                priority
                // placeholder="blur"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function MarkdownScraping({
  user,
}: {
  user: { id: string; apiKey: string };
}) {
  const { theme } = useTheme();
  const [currentLink, setCurrentLink] = useState("kedaya.xyz");
  const [protocol, setProtocol] = useState("https://");
  const [mdInfo, setMdInfo] = useState<MarkdownScrapingProps>({
    url: "",
    content: "",
    format: "",
    timestamp: "",
    payload: "",
  });
  const [isScraping, setIsScraping] = useState(false);

  const handleScrapingMeta = async () => {
    if (currentLink) {
      setIsScraping(true);
      const res = await fetch(
        `/api/v1/scraping/markdown?url=${protocol}${currentLink}&key=${user.apiKey}`,
      );
      if (!res.ok || res.status !== 200) {
        const data = await res.json();
        toast.error(data.statusText);
      } else {
        const data = await res.json();
        setMdInfo(data);
        toast.success("成功！");
      }
      setIsScraping(false);
    }
  };

  return (
    <>
      <CodeLight content={`https://kedaya.xyz/api/v1/scraping/markdown`} />
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>演示场景</CardTitle>
          <CardDescription>将网站内容转换为Markdown格式。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Select
              onValueChange={(value: string) => {
                setProtocol(value);
              }}
              name="protocol"
              defaultValue={"https://"}
            >
              <SelectTrigger className="h-10 w-24 rounded-r-none bg-transparent shadow-inner">
                <SelectValue placeholder="协议" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="https" value="https://">
                  https://
                </SelectItem>
                <SelectItem key="http" value="http://">
                  http://
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="www.example.com"
              className="h-10 rounded-none border focus:border-primary active:border-primary"
              value={currentLink}
              size={100}
              onChange={(e) => setCurrentLink(e.target.value)}
            />
            <Button
              variant="blue"
              onClick={handleScrapingMeta}
              disabled={isScraping}
              className="rounded-l-none"
            >
              {isScraping ? "抓取中..." : "发送"}
            </Button>
          </div>
          <div className="mt-4 rounded-md border p-3">
            <JsonView
              style={theme === "dark" ? vscodeTheme : githubLightTheme}
              className="max-w-2xl overflow-auto p-2"
              value={mdInfo}
              displayObjectSize={false}
              displayDataTypes={false}
              shortenTextAfterLength={50}
            />

            {mdInfo.content && (
              <pre className="my-4 max-h-64 overflow-y-auto rounded-md border bg-slate-50 p-4 text-xs dark:bg-slate-900">
                {mdInfo.content}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function TextScraping({
  user,
}: {
  user: { id: string; apiKey: string };
}) {
  const { theme } = useTheme();
  const [currentLink, setCurrentLink] = useState("kedaya.xyz");
  const [protocol, setProtocol] = useState("https://");
  const [textInfo, setTextInfo] = useState({
    url: "",
    content: "",
    format: "",
    timestamp: "",
    payload: "",
  });
  const [isScraping, setIsScraping] = useState(false);

  const handleScrapingMeta = async () => {
    if (currentLink) {
      setIsScraping(true);
      const res = await fetch(
        `/api/v1/scraping/text?url=${protocol}${currentLink}&key=${user.apiKey}`,
      );
      if (!res.ok || res.status !== 200) {
        const data = await res.json();
        toast.error(data.statusText);
      } else {
        const data = await res.json();
        setTextInfo(data);
        toast.success("成功！");
      }
      setIsScraping(false);
    }
  };

  return (
    <>
      <CodeLight content={`https://kedaya.xyz/api/v1/scraping/text`} />
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>演示场景</CardTitle>
          <CardDescription>提取网站纯文本内容。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Select
              onValueChange={(value: string) => {
                setProtocol(value);
              }}
              name="protocol"
              defaultValue={"https://"}
            >
              <SelectTrigger className="h-10 w-24 rounded-r-none bg-transparent shadow-inner">
                <SelectValue placeholder="协议" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="https" value="https://">
                  https://
                </SelectItem>
                <SelectItem key="http" value="http://">
                  http://
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="www.example.com"
              className="h-10 rounded-none border focus:border-primary active:border-primary"
              value={currentLink}
              size={100}
              onChange={(e) => setCurrentLink(e.target.value)}
            />
            <Button
              variant="blue"
              onClick={handleScrapingMeta}
              disabled={isScraping}
              className="rounded-l-none"
            >
              {isScraping ? "抓取中..." : "发送"}
            </Button>
          </div>

          <div className="mt-4 rounded-md border p-3">
            <JsonView
              style={theme === "dark" ? vscodeTheme : githubLightTheme}
              className="max-w-2xl overflow-auto p-2"
              value={textInfo}
              displayObjectSize={false}
              displayDataTypes={false}
              shortenTextAfterLength={50}
            />

            {textInfo.content && (
              <pre className="my-4 max-h-64 overflow-y-auto rounded-md border bg-slate-50 p-4 text-xs dark:bg-slate-900">
                {textInfo.content}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function QrCodeScraping({
  user,
}: {
  user: { id: string; apiKey: string };
}) {
  const { theme } = useTheme();
  const [protocol, setProtocol] = useState("https://");

  const [isShoting, setIsShoting] = useState(false);
  const [currentQrLink, setCurrentQrLink] = useState("kedaya.xyz");
  const [qrInfo, setQrInfo] = useState({
    tmp_url: "",
    payload: "",
  });

  const handleScrapingScreenshot = async () => {
    if (currentQrLink) {
      setIsShoting(true);
      const payload = `/api/v1/scraping/qrcode?url=${protocol}${currentQrLink}&key=${user.apiKey}`;
      const res = await fetch(payload);
      if (!res.ok || res.status !== 200) {
        toast.error(res.statusText);
      } else {
        const blob = await res.blob();
        const imageUrl = URL.createObjectURL(blob);
        setQrInfo({
          tmp_url: imageUrl,
          payload: `${window.location.origin}${payload}`,
        });
        toast.success("成功！");
      }
      setIsShoting(false);
    }
  };

  const handleDownloadQrCode = async () => {
    const link = document.createElement("a");
    link.download = `QRCODE-${currentQrLink}.png`;
    link.href = qrInfo.tmp_url;
    link.click();
  };

  return (
    <>
      <CodeLight content={`https://kedaya.xyz/api/v1/scraping/qrcode`} />
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>演示场景</CardTitle>
          <CardDescription>
            生成任何URL的二维码，方便在移动设备上快速访问网站。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Select
              onValueChange={(value: string) => {
                setProtocol(value);
              }}
              name="protocol"
              defaultValue="https://"
            >
              <SelectTrigger className="h-10 w-24 rounded-r-none bg-transparent shadow-inner">
                <SelectValue placeholder="协议" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="https" value="https://">
                  https://
                </SelectItem>
                <SelectItem key="http" value="http://">
                  http://
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="www.example.com"
              className="h-10 rounded-none border focus:border-primary active:border-primary"
              value={currentQrLink}
              size={100}
              onChange={(e) => setCurrentQrLink(e.target.value)}
            />
            <Button
              variant="blue"
              onClick={handleScrapingScreenshot}
              disabled={isShoting}
              className="rounded-l-none"
            >
              {isShoting ? "生成中..." : "发送"}
            </Button>
          </div>

          <div className="mt-4 rounded-md border p-3">
            <JsonView
              className="max-w-2xl overflow-auto p-2"
              style={theme === "dark" ? vscodeTheme : githubLightTheme}
              value={qrInfo}
              displayObjectSize={false}
              displayDataTypes={false}
              // shortenTextAfterLength={50}
            />
            {qrInfo.tmp_url && (
              <div className="flex flex-col items-center justify-center">
                <BlurImage
                  src={qrInfo.tmp_url}
                  alt="QR Code"
                  className="my-4 flex max-h-52 rounded-md border object-contain object-center shadow-md"
                  width={200}
                  height={200}
                  priority
                  // placeholder="blur"
                />
                <Button
                  className="mt-2"
                  variant="outline"
                  onClick={handleDownloadQrCode}
                >
                  下载二维码
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export const CodeLight = ({ content }: { content: string }) => {
  return (
    <>
      <div className="relative -mt-1 mb-2 flex items-center gap-2 rounded-lg border bg-slate-50 p-2 dark:bg-slate-950">
        <pre className="text-xs text-neutral-700 dark:text-neutral-300">
          {content}
        </pre>
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded bg-neutral-200 px-1 py-0.5 text-xs text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          onClick={() => {
            navigator.clipboard.writeText(content);
            toast.success("已复制到剪贴板!");
          }}
        >
          复制
        </div>
      </div>
    </>
  );
};
