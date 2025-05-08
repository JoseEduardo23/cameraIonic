import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private PHOTOS_STORAGE: string = 'photos';
  public savedPhotos: UserPhoto[] = [];

  constructor(private platform: Platform) {}

  private async savePicture(photo: Photo, quality: number) {
    const base64Data = await this.readAsBase64(photo);
    const fileName = Date.now() + '.jpg';
    
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    return {
      filepath: fileName,
      webviewPath: photo.webPath
    };
  }

  private async readAsBase64(photo: Photo) {
    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({ path: photo.path! });
      return file.data;
    } else {
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      return await this.convertBlobToBase64(blob) as string;
    }
  }

  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

  public async takePhoto(quality: number = 100) {
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: quality
    });

    const savedImage = await this.savePicture(capturedPhoto, quality);
    this.savedPhotos.unshift(savedImage);
    await this.saveToStorage();
  }

  private async saveToStorage() {
    await Preferences.set({
      key: this.PHOTOS_STORAGE,
      value: JSON.stringify(this.savedPhotos)
    });
  }

  public async loadSavedPhotos() {
    const { value } = await Preferences.get({ key: this.PHOTOS_STORAGE });
    this.savedPhotos = (value ? JSON.parse(value) : []) as UserPhoto[];

    if (!this.platform.is('hybrid')) {
      for (let photo of this.savedPhotos) {
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        });
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}