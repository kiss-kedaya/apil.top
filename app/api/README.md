# API接口规范

## 响应格式标准

所有API响应都应遵循以下格式：

```typescript
interface ApiResponse<T = any> {
  success: boolean;   // 请求是否成功
  data?: T;           // 返回的数据
  message?: string;   // 消息说明
  code?: number;      // 错误代码(可选)
}
```

## 状态码使用规范

- 200: 成功
- 400: 请求参数错误
- 401: 未认证或认证失败
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误
- 502: 外部服务错误

## 开发规范

### 目录结构

API应按功能模块组织，每个资源类型一个目录：

```
app/api/
  ├── user/               // 用户相关API
  │   ├── route.ts        // 用户列表、创建用户
  │   ├── [id]/           // 用户详情、更新、删除
  │   └── info/           // 用户信息相关操作
  ├── url/                // URL相关API
  └── ...
```

### 工具使用

所有API应使用以下工具函数：

1. 错误处理和响应：
   - `createSuccessResponse` - 创建成功响应
   - `createErrorResponse` - 创建错误响应
   - `withApiHandler` - API错误处理包装器

2. 中间件：
   - `withAuth` - 用户认证
   - `withValidation` - 数据验证
   - `withSession` - 会话管理

### 代码示例

```typescript
// 带验证的API
export const POST = withApiHandler(
  (req: Request) => withValidation(mySchema, processData)(req),
  "context/name"
);

// 带认证的API
export const GET = withAuth(async (req, user) => {
  // 处理逻辑
  return createSuccessResponse(data);
});
```
