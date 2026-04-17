namespace YLWorks.Model
{
    public class WorkOrder: BaseEntity
    {
        public Guid Id { get; set; }
        public string WorkOrderNo { get; set; }        
        public Guid ProjectId { get; set; }
        public Project Project { get; set; }
        public string? Title { get; set; } = string.Empty;
        public DateTime? WorkOrderDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = "InProgress"; // InProgress, OnHold, Completed
        public ICollection<WorkOrderTask> WorkOrderTasks { get; set; } = new List<WorkOrderTask>();
        public List<WorkOrderAssignment> WorkOrderAssignments { get; set; } = new();

        public DateTime? StartedAt { get; set; }
        public DateTime? OnHoldAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        public Guid? CreatedById { get; set; }
        public User? CreatedBy { get; set; }

        public string Priority { get; set; } = "Normal"; 
    }

    public class CreateWorkOrderRequest
    {
        public string WorkOrderNo { get; set; }
        public Guid ProjectId { get; set; }
        public string? Title { get; set; } = string.Empty;
        public DateTime? WorkOrderDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public string? Priority { get; set; }
    }

    public class UpdateWorkOrderRequest: CreateWorkOrderRequest
    {
        public Guid Id { get; set; }
    }

    public class UpdateWorkOrderStatusRequest
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? StartedAt { get; set; }
        public DateTime? OnHoldAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class WorkOrderAssignment: BaseEntity
    {
        public Guid Id { get; set; }

        public Guid WorkOrderId { get; set; }
        public WorkOrder WorkOrder { get; set; }

        public Guid UserId { get; set; }
        public User User { get; set; }

        public string? Role { get; set; } // Technician / Supervisor / Helper

        public DateTime AssignedAt { get; set; } = DateTime.Now;
    }

    public class WorkOrderTask : BaseEntity
    {
        public Guid Id { get; set; }
        public Guid WorkOrderId { get; set; }
        public WorkOrder WorkOrder { get; set; }
        public string? TaskNo { get; set; }
        public string? TaskName { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string Status { get; set; }
        public string Priority { get; set; } = "Normal";
        public Guid? AssignedToId { get; set; }
        public User? AssignedTo { get; set; }
        public List<AttachmentDto>? Attachments { get; set; }
    }

    public class CreateWorkOrderTask
    {
        public Guid WorkOrderId { get; set; }
        public string? TaskNo { get; set; }
        public string TaskName { get; set; }
        public string? Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public List<CreateWorkOrderTaskAssignmentRequest> AssignedUsers { get; set; }
        public string? Priority { get; set; }
        public List<AttachmentDto>? Attachments { get; set; }
    }

    public class WorkOrderTaskAssignment
    {
        public Guid Id { get; set; }
        public Guid WorkOrderTaskId { get; set; }
        public WorkOrderTask WorkOrderTask { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }
        public string? Role { get; set; } // Leader / Technician / Helper
        public DateTime? AssignedAt { get; set; }
        public decimal? WorkLoadPercentage { get; set; } // optional
        public string? Notes { get; set; }
    }

    public class CreateWorkOrderTaskAssignmentRequest
    {
        public Guid WorkOrderTaskId { get; set; }
        public Guid UserId { get; set; }
        public string? Role { get; set; } // Leader / Technician / Helper
        public DateTime? AssignedAt { get; set; }
        public decimal? WorkLoadPercentage { get; set; } // optional
        public string? Notes { get; set; }
    }

    public class UpdateWorkOrderTaskAssignmentRequest
    {
        public Guid Id { get; set; }
        public Guid WorkOrderTaskId { get; set; }
        public Guid UserId { get; set; }
        public string? Role { get; set; } // Leader / Technician / Helper
        public DateTime? AssignedAt { get; set; }
        public decimal? WorkLoadPercentage { get; set; } // optional
        public string? Notes { get; set; }
    }

    public class UpdateTaskStatusRequest
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? OnHoldDate { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

}
