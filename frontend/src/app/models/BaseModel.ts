export interface BaseModel {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface BaseOption {
  id: string;
  name: string;
}

export interface CreateBaseOption {
  name: string;
}
export interface DropdownDto {
  id: string;
  name: string;
}
