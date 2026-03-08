import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const today = new Date().toISOString().split("T")[0];
    const results: string[] = [];

    // --- Process recurring income ---
    const { data: recurringIncome, error: incErr } = await supabase
      .from("ac_income")
      .select("*")
      .eq("is_recurring", true)
      .not("recurring_frequency", "is", null);

    if (incErr) throw incErr;

    for (const income of recurringIncome || []) {
      if (shouldCreateNext(income.income_date, income.recurring_frequency, today)) {
        const { error } = await supabase.from("ac_income").insert({
          user_id: income.user_id,
          company_id: income.company_id,
          amount: income.amount,
          category: income.category,
          description: `[Recurring] ${income.description || ""}`,
          income_date: today,
          payment_method: income.payment_method,
          account_id: income.account_id,
          customer_id: income.customer_id,
          tax_amount: income.tax_amount,
          tax_rate_id: income.tax_rate_id,
          currency_code: income.currency_code,
          is_recurring: true,
          recurring_frequency: income.recurring_frequency,
        });
        if (!error) results.push(`Income duplicated: ${income.id}`);
      }
    }

    // --- Process recurring expenses ---
    const { data: recurringExpenses, error: expErr } = await supabase
      .from("ac_expenses")
      .select("*")
      .eq("is_recurring", true)
      .not("recurring_frequency", "is", null);

    if (expErr) throw expErr;

    for (const expense of recurringExpenses || []) {
      if (shouldCreateNext(expense.expense_date, expense.recurring_frequency, today)) {
        const { error } = await supabase.from("ac_expenses").insert({
          user_id: expense.user_id,
          company_id: expense.company_id,
          amount: expense.amount,
          description: `[Recurring] ${expense.description || ""}`,
          expense_date: today,
          payment_method: expense.payment_method,
          account_id: expense.account_id,
          vendor_id: expense.vendor_id,
          category_id: expense.category_id,
          tax_amount: expense.tax_amount,
          tax_rate_id: expense.tax_rate_id,
          currency_code: expense.currency_code,
          is_recurring: true,
          recurring_frequency: expense.recurring_frequency,
          submitted_by: expense.submitted_by,
          approval_status: "approved",
        });
        if (!error) results.push(`Expense duplicated: ${expense.id}`);
      }
    }

    // --- Process recurring invoices ---
    const { data: recurringInvoices, error: invErr } = await supabase
      .from("ac_invoices")
      .select("*")
      .eq("is_recurring", true)
      .not("recurring_frequency", "is", null);

    if (invErr) throw invErr;

    for (const invoice of recurringInvoices || []) {
      if (shouldCreateNext(invoice.issue_date, invoice.recurring_frequency, today)) {
        const dueOffset = Math.round(
          (new Date(invoice.due_date).getTime() - new Date(invoice.issue_date).getTime()) / 86400000
        );
        const newDueDate = new Date(today);
        newDueDate.setDate(newDueDate.getDate() + dueOffset);

        const { data: newInv, error } = await supabase
          .from("ac_invoices")
          .insert({
            user_id: invoice.user_id,
            company_id: invoice.company_id,
            customer_id: invoice.customer_id,
            invoice_number: `${invoice.invoice_number}-R${Date.now().toString(36)}`,
            issue_date: today,
            due_date: newDueDate.toISOString().split("T")[0],
            subtotal: invoice.subtotal,
            tax_amount: invoice.tax_amount,
            total_amount: invoice.total_amount,
            amount_due: invoice.total_amount,
            amount_paid: 0,
            currency_code: invoice.currency_code,
            status: "draft",
            is_recurring: true,
            recurring_frequency: invoice.recurring_frequency,
            notes: invoice.notes,
            terms: invoice.terms,
            template: invoice.template,
          })
          .select()
          .single();

        if (!error && newInv) {
          // Copy invoice items
          const { data: items } = await supabase
            .from("ac_invoice_items")
            .select("*")
            .eq("invoice_id", invoice.id);

          if (items?.length) {
            await supabase.from("ac_invoice_items").insert(
              items.map((item) => ({
                invoice_id: newInv.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                discount: item.discount,
                total: item.total,
                account_id: item.account_id,
                sort_order: item.sort_order,
              }))
            );
          }
          results.push(`Invoice duplicated: ${invoice.id} -> ${newInv.id}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, details: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function shouldCreateNext(lastDate: string, frequency: string, today: string): boolean {
  const last = new Date(lastDate);
  const now = new Date(today);
  const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000);

  switch (frequency) {
    case "daily": return diffDays >= 1;
    case "weekly": return diffDays >= 7;
    case "biweekly": return diffDays >= 14;
    case "monthly": return diffDays >= 28;
    case "quarterly": return diffDays >= 84;
    case "yearly": return diffDays >= 360;
    default: return false;
  }
}
