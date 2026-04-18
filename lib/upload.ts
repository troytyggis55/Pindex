import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { supabase } from '@/lib/supabase'

type UploadConfig = {
  bucket: string
  path: string
  width?: number
  height?: number
  quality?: number
  aspect?: [number, number]
}

/** Pick an image from the library and return the local URI, or null if cancelled. */
export async function pickImageUri(aspect: [number, number] = [1, 1]): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect,
    quality: 1,
  })
  return result.canceled ? null : result.assets[0].uri
}

/** Compress a local image URI and upload it to Supabase Storage. Returns the public URL. */
export async function uploadImageUri(uri: string, config: UploadConfig): Promise<string> {
  const actions: ImageManipulator.Action[] = [
    { resize: { width: config.width ?? 400, height: config.height } },
  ]

  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    actions,
    { compress: config.quality ?? 0.8, format: ImageManipulator.SaveFormat.JPEG }
  )

  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const { error } = await supabase.storage
    .from(config.bucket)
    .upload(config.path, decode(base64), {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) throw error

  const { data } = supabase.storage.from(config.bucket).getPublicUrl(config.path)
  return data.publicUrl
}

/** Pick and upload in one step. Returns the public URL, or null if cancelled. */
export async function pickAndUpload(config: UploadConfig): Promise<string | null> {
  const uri = await pickImageUri(config.aspect)
  if (!uri) return null
  return uploadImageUri(uri, config)
}
