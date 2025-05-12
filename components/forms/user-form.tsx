"use client";

import { Dispatch, SetStateAction, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, UserRole } from "@prisma/client";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ROLE_ENUM } from "@/lib/enums";
import { updateUserSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";

import { FormSectionColumns } from "../dashboard/form-section-columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";

export type FormData = User;

export type FormType = "edit";

export interface RecordFormProps {
  user: Pick<User, "id" | "name">;
  isShowForm: boolean;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  type: FormType;
  initData?: User | null;
  onRefresh: () => void;
  onUpdateSuccess?: (updatedUser: User) => void;
}

export function UserForm({
  setShowForm,
  type,
  initData,
  onRefresh,
  onUpdateSuccess,
}: RecordFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const {
    handleSubmit,
    register,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      id: initData?.id || "",
      name: initData?.name || "",
      active: initData?.active || 1,
      email: initData?.email || "",
      image: initData?.image || "",
      role: initData?.role || "USER",
      team: initData?.team || "free",
    },
  });

  const onSubmit = handleSubmit((data) => {
    if (type === "edit") {
      handleUpdate(data);
    }
  });

  const handleUpdate = async (data: User) => {
    startTransition(async () => {
      if (type === "edit") {
        const response = await fetch("/api/user/admin/update", {
          method: "POST",
          body: JSON.stringify({ id: initData?.id, data }),
        });
        
        if (!response.ok || response.status !== 200) {
          toast.error("Update Failed", {
            description: response.statusText,
          });
        } else {
          const result = await response.json();
          toast.success(`Update successfully!`);
          setShowForm(false);
          
          // 如果有更新后的用户数据并且提供了onUpdateSuccess回调，调用它
          if (result.user && onUpdateSuccess) {
            onUpdateSuccess(result.user);
          } else {
            // 如果没有获取到更新后的用户或没有提供回调，则执行传统的刷新
            onRefresh();
          }
        }
      }
    });
  };

  const handleDelete = async () => {
    if (type === "edit") {
      startDeleteTransition(async () => {
        const response = await fetch("/api/user/admin/delete", {
          method: "POST",
          body: JSON.stringify({ id: initData?.id }),
        });
        if (!response.ok || response.status !== 200) {
          toast.error("Delete Failed", {
            description: response.statusText,
          });
        } else {
          toast.success(`Success`);
          setShowForm(false);
          onRefresh();
        }
      });
    }
  };

  return (
    <form
      className="mb-4 rounded-lg border border-dashed p-4 shadow-sm animate-in fade-in-50"
      onSubmit={onSubmit}
    >
      <div className="items-center justify-start gap-4 md:flex">
        <FormSectionColumns title="Email">
          <div className="flex w-full items-center gap-2">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              className="flex-1 shadow-inner"
              size={32}
              disabled
              {...register("email")}
            />
          </div>
          {errors?.email && (
            <p className="p-1 text-[13px] text-red-600">
              {errors.email.message}
            </p>
          )}
        </FormSectionColumns>
        <FormSectionColumns title="Name">
          <Label className="sr-only" htmlFor="name">
            Name
          </Label>
          <Input
            id="name"
            className="flex-1 shadow-inner"
            size={20}
            {...register("name")}
          />
          {errors?.name && (
            <p className="p-1 text-[13px] text-red-600">
              {errors.name.message}
            </p>
          )}
        </FormSectionColumns>
        <FormSectionColumns title="Active">
          <div className="flex w-full items-center gap-2">
            <Label className="sr-only" htmlFor="active">
              Active
            </Label>
            <Switch
              id="active"
              {...register("active")}
              defaultChecked={initData?.active === 1}
              onCheckedChange={(value) => setValue("active", value ? 1 : 0)}
            />
          </div>
        </FormSectionColumns>
      </div>

      <div className="items-center justify-start gap-4 md:flex">
        <FormSectionColumns title="Role">
          <Select
            onValueChange={(value: string) => {
              setValue("role", value as UserRole);
            }}
            name="role"
            defaultValue={`${initData?.role}` || "USER"}
          >
            <SelectTrigger className="w-full shadow-inner">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_ENUM.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormSectionColumns>
        <FormSectionColumns title="Plan">
          <Select
            onValueChange={(value: string) => {
              setValue("team", value);
            }}
            name="team"
            defaultValue={`${initData?.team}` || "free"}
          >
            <SelectTrigger className="w-full shadow-inner">
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {["free", "premium", "business"].map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormSectionColumns>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex justify-end gap-3">
        {type === "edit" && (
          <Button
            type="button"
            variant="destructive"
            className="mr-auto w-[80px] px-0"
            onClick={() => handleDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Icons.spinner className="size-4 animate-spin" />
            ) : (
              <p>Delete</p>
            )}
          </Button>
        )}
        <Button
          type="reset"
          variant="outline"
          className="w-[80px] px-0"
          onClick={() => setShowForm(false)}
        >
          Cancle
        </Button>
        <Button
          type="submit"
          variant="blue"
          disabled={isPending}
          className="w-[80px] shrink-0 px-0"
        >
          {isPending ? (
            <Icons.spinner className="size-4 animate-spin" />
          ) : (
            <p>{type === "edit" ? "Update" : "Save"}</p>
          )}
        </Button>
      </div>
    </form>
  );
}
