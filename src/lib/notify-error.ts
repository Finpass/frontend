import toast from "react-hot-toast";
import { toApiError, userMessage } from "@/lib/api-error";

export function notifyError(err: unknown) {
  const apiError = toApiError(err);
  toast.error(userMessage(apiError));
  return apiError;
}
