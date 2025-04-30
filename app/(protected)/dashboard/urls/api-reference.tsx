import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ApiReference() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API参考</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge>POST /api/v1/short</Badge>
        <div className="mt-2">
          我们提供了一个简单的创建短链接的API。查看使用说明请访问{" "}
          <Link
            href={"/docs/short-urls#api-reference"}
            target="_blank"
            className="font-semibold after:content-['_↗'] hover:text-blue-500 hover:underline"
          >
            API参考
          </Link>
          。
        </div>
      </CardContent>
    </Card>
  );
}
