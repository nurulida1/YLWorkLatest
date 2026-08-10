import { BaseModel } from './BaseModel';
import { UserDto } from './User';

export interface MeetingDto extends BaseModel {
  title: string;
  description: string;
  organizerId: string;
  organizer: UserDto;
  meetingDate: string;
  meetingTime: string;
  meetingMethod: string;
  location?: string;
  meetingLink?: string;
  reminderMinutes: number;
  participants: MeetingParticipantDto[];
}

export interface MeetingParticipantDto {
  id: string;
  meetingId: string;
  meeting: MeetingDto;
  userId: string;
  user: UserDto;
  hasAccepted: boolean;
  hasJoined: boolean;
}

export interface CreateMeetingRequest {
  title: string;
  description: string;
  organizerId: string;
  meetingDate: Date;
  meetingTime: Date;
  location?: string;
  meetingLink?: string;
  reminderMinutes: number;
  participantIds: string[];
}

export interface UpdateMeetingRequest extends CreateMeetingRequest {
  id: string;
}
