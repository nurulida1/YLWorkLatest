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

        // =======================
        // ORGANIZATION
        // =======================
        public DbSet<Department> Departments { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }

        public DbSet<WorkOrder> WorkOrders { get; set; }
        public DbSet<WorkOrderTask> WorkOrderTasks { get; set; }
        public DbSet<WorkOrderAssignment> WorkOrderAssignments { get; set; }

        public DbSet<DeliveryOrder> DeliveryOrders { get; set; }
        public DbSet<DeliveryOrderItem> DeliveryOrderItems { get; set; }
        public DbSet<DeliveryOrderRMA> DeliveryOrderRMAs { get; set; }
        public DbSet<RMAStatusHistory> RMAStatusHistories { get; set; }
        public DbSet<RMAItem> RMAItems { get; set; }
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

        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }

        // =======================
        // INVENTORY / MATERIAL
        // =======================
        public DbSet<MaterialRequest> MaterialRequests { get; set; }
        public DbSet<MaterialItem> MaterialItems { get; set; }
        public DbSet<MaterialRequestStatusHistory> MaterialRequestStatusHistories { get; set; }
        public DbSet<Inventory> Inventories { get; set; }

        public DbSet<AttachmentDto> Attachments { get; set; }

        // =======================
        // FINANCE
        // =======================
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<Payments> Payments { get; set; }
        public DbSet<Income> Incomes { get; set; }
        public DbSet<Expense> Expenses { get; set; }

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


            // =======================
            // RMA
            // =======================
            modelBuilder.Entity<DeliveryOrderRMA>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.RMANo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(30).HasDefaultValue("Draft");
            });

            modelBuilder.Entity<RMAStatusHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            modelBuilder.Entity<RMAItem>(entity =>
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
                entity.Property(i => i.TotalAmount).HasColumnType("decimal(18,2)");
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

                // Fix: Configure Self-Referencing relationship for Categories
                entity.HasOne(qi => qi.Parent)
                      .WithMany(qi => qi.Children)
                      .HasForeignKey(qi => qi.ParentId)
                      .OnDelete(DeleteBehavior.Restrict); // Prevent accidental cascade loops

                // Fix: Column precision for financial data
                entity.Property(e => e.Quantity).HasColumnType("decimal(18,2)");
                entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.TotalPrice).HasColumnType("decimal(18,2)");

                entity.Property(e => e.Type).HasMaxLength(20);
            });

            modelBuilder.Entity<QuotationStatusHistory>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(sh => sh.Quotation)
                      .WithMany(q => q.QuotationStatusHistories)
                      .HasForeignKey(sh => sh.QuotationId);
            });

            // =======================
            // ATTACHMENT
            // =======================
            modelBuilder.Entity<AttachmentDto>(entity =>
            {
                entity.HasKey(e => e.Id);
            });
        }
    }
}