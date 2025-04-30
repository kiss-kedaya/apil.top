import { auth } from "@/auth";

import { deleteUserById } from "@/lib/dto/user";

export const DELETE = auth(async (req) => {
  if (!req.auth) {
    return new Response(JSON.stringify({ message: "未认证" }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const currentUser = req.auth.user;
  if (!currentUser || !currentUser?.id) {
    return new Response(JSON.stringify({ message: "用户无效" }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    await deleteUserById(currentUser.id);
  } catch (error) {
    return new Response(JSON.stringify({ message: "服务器内部错误" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ message: "用户删除成功！" }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
