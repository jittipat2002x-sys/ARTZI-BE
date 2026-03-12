import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class SignFormDto {
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsUUID()
  @IsNotEmpty()
  petId: string;

  @IsUUID()
  @IsOptional()
  medicalRecordId?: string;

  @IsString()
  @IsNotEmpty()
  signedBy: string;

  @IsString()
  @IsNotEmpty()
  signatureBase64: string; // Base64 image data from signature pad

  @IsString()
  @IsNotEmpty()
  contentSnapshot: string; // The text content as seen by the user when signing
}
