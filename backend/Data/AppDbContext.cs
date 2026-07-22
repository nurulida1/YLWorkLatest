using Microsoft.EntityFrameworkCore;
using YLWorks.Model;

namespace YLWorks.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // =======================
        // SECURITY / ACCESS
        // =======================
        public DbSet<User> Users { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<AccessPermission> AccessPermissions { get; set; }
        public DbSet<SystemModule> SystemModules { get; set; }

        public DbSet<ActivityLog> ActivityLogs { get; set; }

        // =======================
        // ORGANIZATION
        // =======================
        public DbSet<Department> Departments { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }

        public DbSet<ProjectTask> ProjectTasks { get; set; }
        public DbSet<ProjectTaskAssignment> ProjectTaskAssignments { get; set; }
        public DbSet<ProjectTaskAttachment> ProjectTaskAttachments { get; set; }
        public DbSet<ProjectTaskChecklist> ProjectTaskChecklists { get; set; }

        public DbSet<WorkOrder> WorkOrders { get; set; }
        public DbSet<WorkOrderTask> WorkOrderTasks { get; set; }
        public DbSet<WorkOrderAssignment> WorkOrderAssignments { get; set; }

        public DbSet<DeliveryOrder> DeliveryOrders { get; set; }
        public DbSet<DeliveryOrderItem> DeliveryOrderItems { get; set; }
        public DbSet<DeliveryOrderStatusHistory> DeliveryOrderStatusHistories { get; set; }
        //public DbSet<DeliveryOrderProofImage> DeliveryOrderProofImages { get; set; }
        public DbSet<DORMAProofImage> DORMAProofImages { get; set; }
        public DbSet<DORMAStatusHistory> DORMAStatusHistories { get; set; }

        public DbSet<DeliveryOrderRMA> DeliveryOrderRMAs { get; set; }
        public DbSet<DORMAItem> DORMAItems { get; set; }

        public DbSet<PurchaseOrderRMA> PurchaseOrderRMAs { get; set; }
        public DbSet<PORMAItem> PORMAItems { get; set; }
        public DbSet<PORMAProofImage> PORMAProofImages { get; set; }

        public DbSet<SectionInventory> SectionInventories { get; set; }
        public DbSet<CategoryInventory> CategoryInventories { get; set; }
        public DbSet<LocationInventory> LocationInventories { get; set; }


        // =======================
        // MASTER DATA
        // =======================
        public DbSet<Company> Companies { get; set; }
        public DbSet<Address> Addresses { get; set; }

        // =======================
        // SALES / PROCUREMENT
        // =======================
        public DbSet<Quotation> Quotations { get; set; }
        public DbSet<QuotationItems> QuotationItems { get; set; }
        public DbSet<QuotationStatusHistory> QuotationStatusHistories { get; set; }
        public DbSet<QuotationTermsAndCondition> QuotationTermsAndConditions { get; set; }
        public DbSet<QuotationOtherInformation> QuotationOtherInformations { get; set; }

        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        public DbSet<PurchaseOrderStatusHistory> PurchaseOrderStatusHistories { get; set; }

        public DbSet<SalesOrder> SalesOrders { get; set; }
        public DbSet<SalesOrderItem> SalesOrderItems { get; set; }
        public DbSet<SalesOrderStatusHistory> SalesOrderStatusHistories { get; set; }

        // =======================
        // INVENTORY / MATERIAL
        // =======================
        public DbSet<GoodsReceiving> GoodsReceivings { get; set; }
        public DbSet<GoodsReceivingItem> GoodsReceivingItems { get; set; }

        public DbSet<MaterialRequest> MaterialRequests { get; set; }
        public DbSet<MaterialItem> MaterialItems { get; set; }
        public DbSet<MaterialRequestStatusHistory> MaterialRequestStatusHistories { get; set; }
        public DbSet<Inventory> Inventories { get; set; }
        // =======================
        // FINANCE
        // =======================
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<Payments> Payments { get; set; }
        public DbSet<Income> Incomes { get; set; }
        public DbSet<Expense> Expenses { get; set; }

        //Setting
        public DbSet<TermsAndCondition> TermsAndConditions { get; set; }
        public DbSet<PaymentTerm> PaymentTerms { get; set; }
        public DbSet<ProductService> ProductServices { get; set; }
        public DbSet<StockTransaction> StockTransactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =======================
            // SECURITY
            // =======================

            modelBuilder.Entity<RolePermission>(entity =>
            {
                entity.HasKey(ra => new { ra.Id });

            });

            modelBuilder.Entity<AccessPermission>(entity =>
            {
                entity.HasKey(ra => new { ra.Id });

            });

            // =======================
            // COMPANY
            // =======================
            modelBuilder.Entity<Company>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            });

           
            // =======================
            // DEPARTMENT
            // =======================
            modelBuilder.Entity<Department>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.HasOne(d => d.Hod)
        .WithMany() // no collection in User
        .HasForeignKey(d => d.HodId)
        .OnDelete(DeleteBehavior.SetNull);
            });

            // =======================
            // PROJECT
            // =======================
            modelBuilder.Entity<ProjectMember>(entity =>
            {
                entity.HasKey(pm => new { pm.ProjectCode, pm.UserId });
            });

            modelBuilder.Entity<ProjectTask>()
    .HasOne(t => t.Project)
    .WithMany(p => p.ProjectTasks)
    .HasForeignKey(t => t.ProjectId)
    .OnDelete(DeleteBehavior.Restrict);

            // =======================
            // WORK ORDER
            // =======================
            modelBuilder.Entity<WorkOrder>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.WorkOrderNo).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<WorkOrderTask>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<WorkOrderAssignment>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // =======================
            // MATERIAL REQUEST
            // =======================
            modelBuilder.Entity<MaterialRequest>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.RequestNo).HasMaxLength(50);

                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .HasDefaultValue("Draft");
            });

            modelBuilder.Entity<MaterialRequestStatusHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<MaterialItem>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");

            });

            // =======================
            // DELIVERY ORDER
            // =======================
            modelBuilder.Entity<DeliveryOrder>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.DeliveryOrderNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Draft");
            });

            modelBuilder.Entity<DeliveryOrderItem>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.QuantityOrdered).HasColumnType("decimal(18,2)");
                entity.Property(e => e.QuantityDelivered).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<DORMAItem>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
            });

            // =======================
            // FINANCE
            // =======================
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.InvoiceNo).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<InvoiceItem>(entity =>
            {
                entity.Property(i => i.Amount).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<Payments>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<Expense>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.ExpenseNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<Income>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.IncomeNo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            });

            // =======================
            // QUOTATION & ITEMS
            // =======================
            modelBuilder.Entity<Quotation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.QuotationNo).IsRequired().HasMaxLength(50);

                // Relationship to Items
                entity.HasMany(q => q.QuotationItems)
                      .WithOne(qi => qi.Quotation)
                      .HasForeignKey(qi => qi.QuotationId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<QuotationItems>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Fix: Column precision for financial data
                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");

                entity.Property(e => e.RowType).HasMaxLength(20);
            });

            modelBuilder.Entity<QuotationStatusHistory>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(sh => sh.Quotation)
                      .WithMany(q => q.QuotationStatusHistories)
                      .HasForeignKey(sh => sh.QuotationId);
            });

            modelBuilder.Entity<ProductService>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.HasMany(x => x.Inventories)
                      .WithOne(x => x.ProductService)
                      .HasForeignKey(x => x.ProductServiceId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }

        
    }
}