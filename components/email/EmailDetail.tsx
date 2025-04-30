"use client";

import { useEffect, useState } from "react";
import { ForwardEmail } from "@prisma/client";
import {
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import {
  cn,
  downloadFile,
  downloadFileFromUrl,
  formatDate,
  formatFileSize,
} from "@/lib/utils";
import { Icons } from "@/components/shared/icons";

import { BlurImg } from "../shared/blur-image";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface EmailDetailProps {
  email: ForwardEmail | undefined;
  selectedEmailId: string | null;
  onClose: () => void;
  onMarkAsRead: () => void;
}

interface Attachment {
  filename: string;
  r2Path: string;
  mimeType: string;
  size: number;
}

const fileTypeMap: { [key: string]: string } = {
  "application/pdf": "pdf",
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/gif": "gif",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",

  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "audio/mpeg": "mp3",
  "video/mp4": "mp4",
  "application/zip": "zip",
  default: "unknown",
};

const fileTypeIcons: { [key: string]: React.ComponentType<any> } = {
  "application/pdf": FileText, // PDF 文件
  "image/jpeg": FileImage, // JPEG 图片
  "image/png": FileImage, // PNG 图片
  "image/gif": FileImage, // GIF 图片
  "application/msword": FileText, // Word 文档 (.doc)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    FileText, // Word 文档 (.docx)
  "application/vnd.ms-excel": FileSpreadsheet, // Excel 表格 (.xls)
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    FileSpreadsheet, // Excel 表格 (.xlsx)
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    FileSpreadsheet, // PowerPoint 文档
  "audio/mpeg": FileAudio, // MP3 音频
  "video/mp4": FileVideo, // MP4 视频
  "application/zip": FileArchive, // ZIP 压缩文件
  default: File, // 默认图标
};

export default function EmailDetail({
  email,
  selectedEmailId,
  onClose,
  onMarkAsRead,
}: EmailDetailProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null); // 控制图片预览 Modal

  function getFileIcon(type: string): React.ComponentType<any> {
    const icon = Object.keys(fileTypeIcons).find((key) =>
      type.toLowerCase().startsWith(key),
    );
    return fileTypeIcons[icon || "default"];
  }

  const handleDownload = async (attachment: Attachment) => {
    downloadFile(
      `${siteConfig.emailR2Domain}/${attachment.r2Path}`,
      attachment.filename,
    );
    // downloadFileFromUrl(
    //   `${siteConfig.emailR2Domain}/${attachment.r2Path}`,
    //   attachment.filename,
    // );
  };

  if (!email) return null;

  let attachments: Attachment[] = [];
  try {
    if (email.attachments) {
      attachments = JSON.parse(email.attachments);
    }
  } catch (error) {
    console.log("解析附件失败:", error);
  }

  // 处理邮件内容中的图片链接
  const processContent = (content: string): string => {
    if (!content || attachments.length === 0) return content;

    let processedContent = content;

    // 如果是 HTML，解析 DOM 并替换 <img> 标签的 src
    if (email.html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const images = Array.from(doc.getElementsByTagName("img")); // 转换为数组

      images.forEach((img) => {
        const alt = img.getAttribute("alt") || "";
        const matchingAttachment = attachments.find(
          (att) => att.filename === alt,
        );
        if (matchingAttachment) {
          img.setAttribute(
            "src",
            `${siteConfig.emailR2Domain}/${matchingAttachment.r2Path}`,
          );
        }
      });
      processedContent = doc.documentElement.outerHTML; // 返回完整的 HTML
    } else if (email.text) {
      // 如果是纯文本，替换文件名
      attachments.forEach((attachment) => {
        const regex = new RegExp(`\\b${attachment.filename}\\b`, "g");
        processedContent = processedContent.replace(
          regex,
          `${siteConfig.emailR2Domain}/${attachment.r2Path}`,
        );
      });
    }

    return processedContent;
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-primary-foreground text-primary shadow-md",
        selectedEmailId ? "animate-fade-in-right" : "animate-fade-in-left",
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b px-2 py-2">
        <div
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-900 text-sm font-bold text-white"
        >
          {email.subject?.[0].toUpperCase() ||
            email.fromName?.[0].toUpperCase() ||
            "U"}
        </div>
        <div className="max-w-[80%] grow text-neutral-600 dark:text-neutral-300">
          <p className="text-sm">
            <strong>{email.subject}</strong>
          </p>
          <TooltipProvider>
            <Tooltip delayDuration={100}>
              <TooltipTrigger className="line-clamp-2 text-wrap text-left text-xs">
                <strong>发件人:</strong> {email.fromName} &lt;{email.from}&gt;
              </TooltipTrigger>
              <TooltipContent side="bottom" className="w-60 text-wrap text-xs">
                {email.fromName} <br />
                {email.from}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-xs">
            <strong>收件人:</strong> {email.to}
          </p>
          {email.replyTo && (
            <p className="text-xs">
              <strong>回复地址:</strong> {email.replyTo}
            </p>
          )}
          <p className="text-xs">
            <strong>日期:</strong> {formatDate(email.date as any)}
          </p>
          {attachments.length > 0 && (
            <p className="text-xs">
              <strong>附件</strong>: {attachments.length}
            </p>
          )}
        </div>
        <Button
          className="ml-auto size-8 grow-0 px-1 py-1"
          size={"sm"}
          onClick={onClose}
          variant={"outline"}
        >
          <Icons.close className="size-4" />
        </Button>
      </div>

      <div className="scrollbar-hidden flex h-full flex-col justify-between overflow-y-auto px-2 py-3">
        <div
          className=""
          dangerouslySetInnerHTML={{
            __html: processContent(email.html || email.text || ""),
          }}
        />

        {attachments.length > 0 && (
          <div className="mt-auto border-t border-dashed py-3">
            <h3 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-400">
              附件 ({attachments.length})
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {attachments.map((attachment, index) => {
                const FileIcon = getFileIcon(attachment.mimeType); // 动态获取图标
                return (
                  <div
                    key={index}
                    className="group relative flex items-center justify-between rounded-md border border-dotted bg-gray-100 p-2 transition-shadow hover:border-dashed dark:bg-neutral-800"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {attachment.mimeType.startsWith("image/") ? (
                        <BlurImg
                          src={`${siteConfig.emailR2Domain}/${attachment.r2Path}`}
                          alt={attachment.filename}
                          className="h-10 w-10 cursor-pointer rounded object-cover"
                          onClick={() =>
                            setPreviewImage(
                              `${siteConfig.emailR2Domain}/${attachment.r2Path}`,
                            )
                          }
                          width={40}
                          height={40}
                        />
                      ) : (
                        <FileIcon className="h-10 w-10 rounded bg-neutral-200 p-2 text-neutral-700" />
                      )}
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-xs font-medium">
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      className="ml-2 flex shrink-0 items-center justify-center rounded-full bg-neutral-200 p-1 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-700"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Icons.download className="h-3 w-3 text-neutral-700 dark:text-neutral-200" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Modal
        showModal={!!previewImage}
        setShowModal={() => setPreviewImage(null)}
        className="flex h-[90vh] max-h-[90vh] w-auto max-w-[90vw] flex-col overflow-hidden p-0"
      >
        <div className="relative h-full w-full overflow-hidden">
          {previewImage && (
            <img
              src={previewImage}
              alt="预览图片"
              className="h-full w-full object-contain"
            />
          )}
          <Button
            onClick={() => setPreviewImage(null)}
            className="absolute right-2 top-2 z-10 rounded-full bg-neutral-900/30 p-2 text-white backdrop-blur-md hover:bg-neutral-900/60"
            size={"sm"}
            variant={"ghost"}
          >
            <Icons.close className="h-4 w-4" />
          </Button>
        </div>
      </Modal>
    </div>
  );
}
