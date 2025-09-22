import cloudinary from "../config/cloudinary";
import { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";


type CloudinaryResourceType = "image" | "video" | "raw";


export class CloudinaryService {
    static uploadFile(
        fileBuffer: Buffer,
        folder: string,
        resourceType: CloudinaryResourceType,
        publicId?: string
    ): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: resourceType,
                    public_id: publicId,
                    overwrite: !!publicId
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result!);
                }
            );
            streamifier.createReadStream(fileBuffer).pipe(uploadStream);
        });
    }


    static async deleteFile(publicId: string, resourceType: CloudinaryResourceType) {
        return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    }


    static async uploadUserProfilePicture(userId: string, fileBuffer: Buffer, public_id?: string) {
        return CloudinaryService.uploadFile(fileBuffer, `profile_picture/${userId}`, "image", public_id);
    }

    static async uploadChatMedia(chatId: string, fileBuffer: Buffer, type: CloudinaryResourceType) {
        return CloudinaryService.uploadFile(fileBuffer, `chat/${chatId}`, type);
    }

}
