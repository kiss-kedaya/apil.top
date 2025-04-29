import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { UserAvatar } from "@/components/shared/user-avatar";

function DeleteAccountModal({
  showDeleteAccountModal,
  setShowDeleteAccountModal,
}: {
  showDeleteAccountModal: boolean;
  setShowDeleteAccountModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { data: session } = useSession();
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    setDeleting(true);
    await fetch(`/api/user`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (res.status === 200) {
        // delay to allow for the route change to complete
        await new Promise((resolve) =>
          setTimeout(() => {
            signOut({
              callbackUrl: `${window.location.origin}/`,
            });
            resolve(null);
          }, 500),
        );
      } else {
        setDeleting(false);
        const error = await res.text();
        throw error;
      }
    });
  }

  return (
    <Modal
      showModal={showDeleteAccountModal}
      setShowModal={setShowDeleteAccountModal}
      className="gap-0"
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b p-4 pt-8 sm:px-16">
        <UserAvatar
          user={{
            name: session?.user?.name || null,
            image: session?.user?.image || null,
          }}
        />
        <h3 className="text-lg font-semibold">删除账户</h3>
        <p className="text-center text-sm text-muted-foreground">
          <b>警告：</b>这将永久删除您的账户和活跃的订阅！
        </p>

        {/* TODO: Use getUserSubscriptionPlan(session.user.id) to display the user's subscription if he have a paid plan */}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          toast.promise(deleteAccount(), {
            loading: "正在删除账户...",
            success: "账户删除成功！",
            error: (err) => err,
          });
        }}
        className="flex flex-col space-y-6 bg-accent px-4 py-8 text-left sm:px-16"
      >
        <div>
          <label htmlFor="verification" className="block text-sm">
            确认删除，请输入{" "}
            <span className="font-semibold text-black dark:text-white">
              confirm delete account
            </span>{" "}
            在下方
          </label>
          <Input
            type="text"
            name="verification"
            id="verification"
            pattern="confirm delete account"
            required
            autoFocus={false}
            autoComplete="off"
            className="mt-1 w-full border bg-background"
          />
        </div>

        <Button
          variant={deleting ? "disable" : "destructive"}
          disabled={deleting}
        >
          确认删除账户
        </Button>
      </form>
    </Modal>
  );
}

export function useDeleteAccountModal() {
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const DeleteAccountModalCallback = useCallback(() => {
    return (
      <DeleteAccountModal
        showDeleteAccountModal={showDeleteAccountModal}
        setShowDeleteAccountModal={setShowDeleteAccountModal}
      />
    );
  }, [showDeleteAccountModal, setShowDeleteAccountModal]);

  return useMemo(
    () => ({
      setShowDeleteAccountModal,
      DeleteAccountModal: DeleteAccountModalCallback,
    }),
    [setShowDeleteAccountModal, DeleteAccountModalCallback],
  );
}
