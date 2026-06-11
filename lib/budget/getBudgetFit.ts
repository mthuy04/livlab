export type BudgetFitStatus = 
  | "UNDER_BUDGET" 
  | "WITHIN_BUDGET" 
  | "SLIGHTLY_OVER_BUDGET" 
  | "OVER_BUDGET" 
  | "UNKNOWN";

export function getBudgetFit(params: {
  total: number;
  budgetMin?: number | null;
  budgetMax?: number | null;
}) {
  const { total, budgetMin, budgetMax } = params;

  if (!total || total <= 0 || !budgetMax || budgetMax <= 0) {
    return {
      status: "UNKNOWN" as BudgetFitStatus,
      label: "Chưa đủ dữ liệu",
      description: "Chưa có đủ thông tin ngân sách hoặc tổng giá để đánh giá.",
      percentage: 0,
    };
  }

  const percentage = Math.round((total / budgetMax) * 100);

  if (budgetMin && total < budgetMin) {
    return {
      status: "UNDER_BUDGET" as BudgetFitStatus,
      label: "Dưới ngân sách",
      description: "Combo hiện tại thấp hơn ngân sách dự kiến. Bạn có thể giữ phương án tiết kiệm hoặc nâng cấp một số sản phẩm.",
      percentage,
    };
  }

  if (total <= budgetMax) {
    return {
      status: "WITHIN_BUDGET" as BudgetFitStatus,
      label: "Vừa ngân sách",
      description: "Combo hiện tại nằm trong khoảng ngân sách mong muốn.",
      percentage,
    };
  }

  if (total <= budgetMax * 1.1) {
    return {
      status: "SLIGHTLY_OVER_BUDGET" as BudgetFitStatus,
      label: "Hơi vượt ngân sách",
      description: "Combo hiện tại vượt nhẹ ngân sách. Bạn có thể thay một vài sản phẩm để tối ưu chi phí.",
      percentage,
    };
  }

  return {
    status: "OVER_BUDGET" as BudgetFitStatus,
    label: "Vượt ngân sách",
    description: "Combo hiện tại vượt khá nhiều so với ngân sách. Nên chọn lại sản phẩm hoặc tăng ngân sách dự kiến.",
    percentage,
  };
}
