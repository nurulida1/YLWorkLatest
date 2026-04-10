using Microsoft.EntityFrameworkCore;
using YLWorks.Model;

namespace YLWorks.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // DB Sets
        public DbSet<Department> Departments { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Address> Addresses { get; set; } // Added this so you can query addresses directly
        public DbSet<Holiday> Holidays { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<LeaveApplication> LeaveApplications { get; set; }
        public DbSet<LeaveEntitlement> LeaveEntitlements { get; set; }
        public DbSet<LeaveType> LeaveTypes { get; set; }
        public DbSet<MaterialRequest> MaterialRequests { get; set; }
        public DbSet<MaterialItem> MaterialItems { get; set; }
        public DbSet<Payments> Payments { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<PermissionRole> PermissionRoles { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<POItem> POItems { get; set; }
        public DbSet<Quotation> Quotations { get; set; }
        public DbSet<QuotationItems> QuotationItems { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<ProjectTask> ProjectTasks { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Delivery> Deliveries { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<Income> Incomes { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Event> Events { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 1. Client & Address
            modelBuilder.Entity<Client>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);

                entity.HasOne(e => e.BillingAddress).WithMany().HasForeignKey(e => e.BillingAddressId).OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(e => e.DeliveryAddress).WithMany().HasForeignKey(e => e.DeliveryAddressId).OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            });

            modelBuilder.Entity<Event>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired();
            });

            modelBuilder.Entity<Address>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.AddressLine1).IsRequired().HasMaxLength(255);
            });

            modelBuilder.Entity<Income>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.IncomeNo).IsRequired().HasMaxLength(50);
            });

            // 2. Department (Consolidated)
            modelBuilder.Entity<Department>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Status).HasDefaultValue("Active");

                entity.HasOne(d => d.Hod).WithMany().HasForeignKey(d => d.HodId).OnDelete(DeleteBehavior.Restrict);
            });

            // 3. Finance (Invoices, Quotations, Payments)
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.InvoiceNo).IsRequired().HasMaxLength(50);

                entity.HasMany(i => i.InvoiceItems).WithOne(ii => ii.Invoice).HasForeignKey(ii => ii.InvoiceId).OnDelete(DeleteBehavior.Cascade);
                entity.HasMany(e => e.Payments).WithOne(p => p.Invoice).HasForeignKey(p => p.InvoiceId).OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<InvoiceItem>(entity => {
                entity.Property(i => i.TotalAmount).HasColumnType("decimal(18,2)");
            });

            modelBuilder.Entity<Payments>(entity => {
                entity.HasKey(e => e.Id);

                // Explicitly link the navigation property 'Client' 
                // to the existing property 'ClientId'
                entity.HasOne(e => e.Client)
                      .WithMany()
                      .HasForeignKey(e => e.ClientId) // This stops the creation of ClientId1
                      .OnDelete(DeleteBehavior.Restrict);

                // Link Invoice
                entity.HasOne(e => e.Invoice)
                      .WithMany(i => i.Payments)
                      .HasForeignKey(e => e.InvoiceId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
            });

            modelBuilder.Entity<Quotation>(entity =>
            {
                entity.Property(q => q.Gross).HasColumnType("decimal(18,2)");
                entity.Property(q => q.TotalAmount).HasColumnType("decimal(18,2)");
                entity.Property(q => q.Discount).HasColumnType("decimal(18,2)");
                entity.HasMany(q => q.Items).WithOne(qi => qi.Quotation).HasForeignKey(qi => qi.QuotationId).OnDelete(DeleteBehavior.Cascade);
            });

            // 4. Project Management
            modelBuilder.Entity<ProjectMember>(entity =>
            {
                entity.HasKey(pm => new { pm.ProjectId, pm.UserId });
            });

            modelBuilder.Entity<PermissionRole>(entity =>
            {
                entity.HasKey(pr => new { pr.PermissionId, pr.RoleId });
            });

            // 5. Attachments (Generic Cascade Logic)
            modelBuilder.Entity<Attachment>(entity =>
            {
                entity.HasKey(a => a.Id);
                entity.Property(a => a.FileData).IsRequired();

                // Ensure all relationships are defined here or in the parent entity
                entity.HasOne(a => a.Invoice).WithMany(i => i.Attachments).HasForeignKey(a => a.InvoiceId).OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(a => a.LeaveApplication).WithMany(l => l.Attachments).HasForeignKey(a => a.LeaveApplicationId).OnDelete(DeleteBehavior.Cascade);
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}