import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Download, Star, Landmark, ImagePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { formatCurrency } from "../lib/utils";
import { EmptyState, Modal } from "../components/Shared";
import { useNavigate } from "react-router-dom";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  WAITING_CONFIRMATION: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  CANCELLED: "bg-neutral-200 text-neutral-600",
  EXPIRED: "bg-red-100 text-red-700",
  REFUNDED: "bg-blue-100 text-blue-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Waiting for payment",
  WAITING_CONFIRMATION: "Waiting for confirmation",
  PAID: "Paid",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  REFUNDED: "Refunded",
};

export default function Orders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [reviewOrder, setReviewOrder] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const {
    data: orders,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await api.get("/orders/me")).data.data,
  });

  const { data: bankInfo } = useQuery({
    queryKey: ["bank-info"],
    queryFn: async () => (await api.get("/payments/bank-info")).data.data,
    enabled: !!paymentOrder,
  });

  const uploadProofMutation = useMutation({
    mutationFn: async () => {
      if (!proofFile) throw new Error("Choose a payment proof image first");
      const formData = new FormData();
      formData.append("proof", proofFile);
      return api.post(`/payments/${paymentOrder.id}/proof`, formData);
    },
    onSuccess: () => {
      toast.success("Payment proof uploaded! Waiting for admin confirmation.");
      closePaymentModal();
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Upload failed"),
  });

  function openPaymentModal(order: any) {
    setPaymentOrder(order);
    setProofFile(null);
    setProofPreview(null);
  }

  function closePaymentModal() {
    setPaymentOrder(null);
    setProofFile(null);
    setProofPreview(null);
  }

  function handleProofChange(file: File | undefined) {
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function submitReview() {
    try {
      await api.post("/reviews", { orderId: reviewOrder.id, rating, comment });
      toast.success("Review submitted!");
      setReviewOrder(null);
      setComment("");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    }
  }

  function downloadInvoice(order: any) {
    const content = `INVOICE\n\nInvoice Number: ${order.invoiceNumber}\nEvent: ${order.event?.title}\nDate: ${dayjs(order.createdAt).format("DD MMM YYYY")}\nSubtotal: ${formatCurrency(order.subtotal)}\nDiscount: ${formatCurrency(order.discountTotal)}\nTotal: ${formatCurrency(order.total)}\nStatus: ${order.status}\n`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading)
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-neutral-400">
        Loading orders...
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold">My Tickets</h1>

      {orders?.length ? (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">{order.event?.title}</p>
                  <p className="text-xs text-neutral-500">
                    Invoice: {order.invoiceNumber}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
                >
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <div className="mb-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                {order.items?.map((item: any) => (
                  <p key={item.id}>
                    {item.ticketType?.name} x{item.quantity} —{" "}
                    {formatCurrency(Number(item.price) * item.quantity)}
                  </p>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3">
                <p className="font-bold">{formatCurrency(order.total)}</p>
                <div className="flex gap-2">
                  {order.status === "PAID" && (
                    <>
                      <button
                        onClick={() => downloadInvoice(order)}
                        className="btn-secondary !px-3 !py-1.5 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" /> Invoice
                      </button>
                      {!order.review && (
                        <button
                          onClick={() => setReviewOrder(order)}
                          className="btn-secondary !px-3 !py-1.5 text-xs"
                        >
                          <Star className="h-3.5 w-3.5" /> Review
                        </button>
                      )}
                    </>
                  )}
                  {order.status === "PENDING" && (
                    <button
                      onClick={() => openPaymentModal(order)}
                      className="btn-primary !px-3 !py-1.5 text-xs"
                    >
                      <Landmark className="h-3.5 w-3.5" /> Submit Payment
                    </button>
                  )}
                  {order.status === "WAITING_CONFIRMATION" && (
                    <span className="text-xs text-neutral-400">
                      Payment proof sent — waiting for admin review.
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No orders yet"
          message="Book your first event to see it here."
          actionLabel="Explore Events"
          onAction={() => navigate("/events")}
        />
      )}

      {/* Review modal */}
      <Modal
        open={!!reviewOrder}
        onClose={() => setReviewOrder(null)}
        title="Rate this event"
      >
        <div className="mb-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>
              <Star
                className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`}
              />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="input mb-4 min-h-[100px]"
        />
        <button onClick={submitReview} className="btn-primary w-full">
          Submit Review
        </button>
      </Modal>

      {/* Submit payment modal */}
      <Modal
        open={!!paymentOrder}
        onClose={closePaymentModal}
        title="Upload your payment proof"
      >
        <p className="mb-4 text-sm text-neutral-500">
          Transfer{" "}
          <span className="font-semibold text-neutral-700 dark:text-neutral-200">
            {paymentOrder && formatCurrency(paymentOrder.total)}
          </span>{" "}
          to the bank account below, then upload a screenshot or photo of the
          transfer receipt. An admin will manually confirm it.
        </p>

        {bankInfo && (
          <div className="mb-5 rounded-xl bg-neutral-50 dark:bg-neutral-800 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-brand-600">
              <Landmark className="h-4 w-4" /> TRANSFER YOUR PAYMENT TO THIS
              ACCOUNT
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-neutral-400">BANK</p>
                <p className="font-semibold">{bankInfo.bank}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">NAME</p>
                <p className="font-semibold">{bankInfo.accountName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">ACCOUNT NO.</p>
                <p className="font-semibold">{bankInfo.accountNumber}</p>
              </div>
            </div>
          </div>
        )}

        <label className="mb-2 block text-sm font-medium">
          Payment proof image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleProofChange(e.target.files?.[0])}
          className="input mb-4"
        />

        <div className="mb-5 flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 p-3">
          {proofPreview ? (
            <img
              src={proofPreview}
              alt="Payment proof preview"
              className="max-h-52 rounded-lg object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center text-sm text-neutral-400">
              <ImagePlus className="h-6 w-6" />
              Choose a payment proof image to preview it here.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={closePaymentModal} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => uploadProofMutation.mutate()}
            disabled={!proofFile || uploadProofMutation.isPending}
            className="btn-primary"
          >
            {uploadProofMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Upload proof
          </button>
        </div>
      </Modal>
    </div>
  );
}
