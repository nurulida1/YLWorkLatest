START TRANSACTION;
DELETE FROM `Users`
WHERE `Id` = '68315fb8-5429-4fe2-b42c-cf0139881944';
SELECT ROW_COUNT();


ALTER TABLE `Users` ADD `MonthlySalary` decimal(65,30) NULL;

ALTER TABLE `Users` ADD `RestDayHalfDayEnd` time(6) NULL;

ALTER TABLE `Users` ADD `RestDayHalfDayStart` time(6) NULL;

ALTER TABLE `Users` ADD `UsesRestDayHalfDay` tinyint(1) NULL;

ALTER TABLE `Users` ADD `WorkEndTime` time(6) NULL;

ALTER TABLE `Users` ADD `WorkStartTime` time(6) NULL;

ALTER TABLE `UserDto` ADD `MonthlySalary` decimal(65,30) NULL;

ALTER TABLE `UserDto` ADD `RestDayHalfDayEnd` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `UserDto` ADD `RestDayHalfDayStart` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `UserDto` ADD `UsesRestDayHalfDay` tinyint(1) NULL;

ALTER TABLE `UserDto` ADD `WorkEndTime` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `UserDto` ADD `WorkStartTime` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Notifications` ADD `ClaimRequestId` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `LeaveTypes` ADD `AllowsBalanceCascade` tinyint(1) NOT NULL DEFAULT FALSE;

ALTER TABLE `Inventories` MODIFY COLUMN `ReservedQuantity` decimal(18,3) NULL;

ALTER TABLE `Inventories` MODIFY COLUMN `Quantity` decimal(18,3) NULL;

ALTER TABLE `Inventories` MODIFY COLUMN `Costs` decimal(18,2) NULL;

ALTER TABLE `Departments` ADD `RestDayHalfDayEnd` time(6) NULL;

ALTER TABLE `Departments` ADD `RestDayHalfDayStart` time(6) NULL;

ALTER TABLE `Departments` ADD `UsesRestDayHalfDay` tinyint(1) NULL;

ALTER TABLE `Departments` ADD `WorkEndTime` time(6) NULL;

ALTER TABLE `Departments` ADD `WorkStartTime` time(6) NULL;

CREATE TABLE `ClaimRequests` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `EmployeeId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ClaimType` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `TotalAmount` decimal(18,2) NOT NULL,
    `Remarks` longtext CHARACTER SET utf8mb4 NOT NULL,
    `SubmittedAt` datetime(6) NOT NULL,
    `Destination` varchar(200) CHARACTER SET utf8mb4 NULL,
    `TripStartDate` datetime(6) NULL,
    `TripEndDate` datetime(6) NULL,
    `CreatedAt` datetime(6) NULL,
    `UpdatedAt` datetime(6) NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
    CONSTRAINT `PK_ClaimRequests` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ClaimRequests_Users_EmployeeId` FOREIGN KEY (`EmployeeId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `ClaimSettings` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `IsActive` tinyint(1) NOT NULL,
    `MedicalPerReceiptLimit` decimal(18,2) NOT NULL,
    `MedicalMonthlyTotalLimit` decimal(18,2) NOT NULL,
    `SafetyShoesLimit` decimal(18,2) NOT NULL,
    `MileageCarRatePerKm` decimal(18,4) NOT NULL,
    `MileageMotorcycleRatePerKm` decimal(18,4) NOT NULL,
    `MealAllowancePerDay` decimal(18,2) NOT NULL,
    `OrdinaryRateDivisorDays` int NOT NULL,
    `OrdinaryDayHours` int NOT NULL,
    `OtNormalMultiplier` decimal(8,4) NOT NULL,
    `OtRestDayFirstBandMultiplier` decimal(8,4) NOT NULL,
    `OtRestDaySecondBandMultiplier` decimal(8,4) NOT NULL,
    `OtRestDayAfter8HourlyMultiplier` decimal(8,4) NOT NULL,
    `OtPublicHolidayUpTo8Multiplier` decimal(8,4) NOT NULL,
    `OtPublicHolidayAfter8HourlyMultiplier` decimal(8,4) NOT NULL,
    `DefaultWorkStartTime` time(6) NOT NULL,
    `DefaultWorkEndTime` time(6) NOT NULL,
    `DefaultUsesRestDayHalfDay` tinyint(1) NOT NULL,
    `DefaultRestDayHalfDayStart` time(6) NOT NULL,
    `DefaultRestDayHalfDayEnd` time(6) NOT NULL,
    `CreatedAt` datetime(6) NULL,
    `UpdatedAt` datetime(6) NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
    CONSTRAINT `PK_ClaimSettings` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `InventoryAudits` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `InventoryId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Action` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NULL,
    `UserName` varchar(200) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `Changes` json NOT NULL,
    CONSTRAINT `PK_InventoryAudits` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_InventoryAudits_Inventories_InventoryId` FOREIGN KEY (`InventoryId`) REFERENCES `Inventories` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `LeaveRequestBalanceAllocations` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `RequestId` char(36) COLLATE ascii_general_ci NOT NULL,
    `LeaveTypeId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Days` double NOT NULL,
    `SortOrder` int NOT NULL,
    `IsUnpaidBucket` tinyint(1) NOT NULL,
    CONSTRAINT `PK_LeaveRequestBalanceAllocations` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_LeaveRequestBalanceAllocations_LeaveRequests_RequestId` FOREIGN KEY (`RequestId`) REFERENCES `LeaveRequests` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_LeaveRequestBalanceAllocations_LeaveTypes_LeaveTypeId` FOREIGN KEY (`LeaveTypeId`) REFERENCES `LeaveTypes` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `ClaimApprovals` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `RequestId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ApproverId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Decision` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `RejectionReason` longtext CHARACTER SET utf8mb4 NULL,
    `ApproverRole` longtext CHARACTER SET utf8mb4 NOT NULL,
    `DecidedAt` datetime(6) NOT NULL,
    `CreatedAt` datetime(6) NULL,
    `UpdatedAt` datetime(6) NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
    CONSTRAINT `PK_ClaimApprovals` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ClaimApprovals_ClaimRequests_RequestId` FOREIGN KEY (`RequestId`) REFERENCES `ClaimRequests` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ClaimApprovals_Users_ApproverId` FOREIGN KEY (`ApproverId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `ClaimDocuments` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `RequestId` char(36) COLLATE ascii_general_ci NOT NULL,
    `DocumentKind` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `FileName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `FileUrl` longtext CHARACTER SET utf8mb4 NOT NULL,
    `UploadedAt` datetime(6) NOT NULL,
    `CreatedAt` datetime(6) NULL,
    `UpdatedAt` datetime(6) NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
    CONSTRAINT `PK_ClaimDocuments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ClaimDocuments_ClaimRequests_RequestId` FOREIGN KEY (`RequestId`) REFERENCES `ClaimRequests` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `ClaimLineItems` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `RequestId` char(36) COLLATE ascii_general_ci NOT NULL,
    `LineKind` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Amount` decimal(18,2) NOT NULL,
    `Category` varchar(30) CHARACTER SET utf8mb4 NULL,
    `PurchaseDate` datetime(6) NULL,
    `WorkDate` datetime(6) NULL,
    `DayType` varchar(30) CHARACTER SET utf8mb4 NULL,
    `Hours` decimal(10,2) NULL,
    `OrdinaryRate` decimal(18,4) NULL,
    `HourlyRate` decimal(18,4) NULL,
    `VehicleType` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Kilometers` decimal(12,2) NULL,
    `MealDays` int NULL,
    `CreatedAt` datetime(6) NULL,
    `UpdatedAt` datetime(6) NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NULL,
    CONSTRAINT `PK_ClaimLineItems` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ClaimLineItems_ClaimRequests_RequestId` FOREIGN KEY (`RequestId`) REFERENCES `ClaimRequests` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

INSERT INTO `Users` (`Id`, `AccessPermission`, `ContactNo`, `CreatedAt`, `CreatedById`, `DisplayName`, `Email`, `EmployeeNo`, `FullName`, `Gender`, `IsActive`, `JobTitle`, `JoinedDate`, `LastLoginAt`, `ManagerId`, `MonthlySalary`, `Password`, `RefreshToken`, `RefreshTokenExpiryTime`, `RejectReason`, `RestDayHalfDayEnd`, `RestDayHalfDayStart`, `Status`, `SystemRole`, `UpdatedAt`, `UpdatedById`, `UsesRestDayHalfDay`, `WorkEndTime`, `WorkStartTime`)
VALUES ('6b73aad4-0a70-40c7-9dfc-bcd0a9453e8f', NULL, '', TIMESTAMP '2026-08-26 14:51:45', NULL, 'Super Admin', 'superAdmin@test.com', 'ADMIN001', 'Super Admin', NULL, TRUE, NULL, NULL, NULL, NULL, NULL, 'AQAAAAIAAYagAAAAEOv2ndhX3+7JWdIqoToQpq74BVCdwYR/7tuiDEAHhUNYUyXbUHpD1bpWtadaMBYn/A==', NULL, NULL, NULL, NULL, NULL, 'Approved', 'SuperAdmin', NULL, NULL, NULL, NULL, NULL);

CREATE INDEX `IX_ClaimApprovals_ApproverId` ON `ClaimApprovals` (`ApproverId`);

CREATE INDEX `IX_ClaimApprovals_RequestId` ON `ClaimApprovals` (`RequestId`);

CREATE INDEX `IX_ClaimDocuments_RequestId` ON `ClaimDocuments` (`RequestId`);

CREATE INDEX `IX_ClaimLineItems_RequestId` ON `ClaimLineItems` (`RequestId`);

CREATE INDEX `IX_ClaimRequests_EmployeeId` ON `ClaimRequests` (`EmployeeId`);

CREATE INDEX `IX_ClaimRequests_Status` ON `ClaimRequests` (`Status`);

CREATE INDEX `IX_ClaimSettings_IsActive` ON `ClaimSettings` (`IsActive`);

CREATE INDEX `IX_InventoryAudits_InventoryId_CreatedAt` ON `InventoryAudits` (`InventoryId`, `CreatedAt`);

CREATE INDEX `IX_LeaveRequestBalanceAllocations_LeaveTypeId` ON `LeaveRequestBalanceAllocations` (`LeaveTypeId`);

CREATE INDEX `IX_LeaveRequestBalanceAllocations_RequestId` ON `LeaveRequestBalanceAllocations` (`RequestId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260826145147_AddClaimManagementModule', '9.0.10');

COMMIT;

