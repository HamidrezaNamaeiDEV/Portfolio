import { text } from '@keystone-6/core/fields'
import sharp from 'sharp'

const maxBytes = 256 * 1024
const maxBase64Length = Math.ceil(maxBytes / 3) * 4
const acceptedImage =
  /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/
const invalidImage =
  'Choose a static PNG, JPEG or WebP image of at most 256 KiB.'
const rejectedUpload = 'invalid-image'

async function prepareImage(value: string): Promise<string | null> {
  if (value.length > maxBase64Length + 32) return null

  const match = acceptedImage.exec(value)
  if (!match) return null
  const bytes = Buffer.from(match[2], 'base64')
  if (bytes.length > maxBytes || bytes.toString('base64') !== match[2])
    return null

  try {
    const image = sharp(bytes, { limitInputPixels: 4_000_000 })
    const metadata = await image.metadata()
    if (metadata.format !== match[1] || (metadata.pages ?? 1) !== 1) return null

    const webp = await image
      .rotate()
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer()
    if (webp.length > maxBytes) return null
    return `data:image/webp;base64,${webp.toString('base64')}`
  } catch {
    return null
  }
}

export function imageField() {
  return text({
    hooks: {
      resolveInput: async ({
        inputFieldData,
        itemField,
        resolvedFieldData,
      }) => {
        if (inputFieldData === null) return ''
        if (typeof resolvedFieldData !== 'string' || !resolvedFieldData)
          return resolvedFieldData
        if (
          resolvedFieldData === itemField &&
          resolvedFieldData.startsWith('data:image/webp;base64,')
        ) {
          return resolvedFieldData
        }

        // Prepare once, then let the validation hook report rejection as an input error.
        return (await prepareImage(resolvedFieldData)) ?? rejectedUpload
      },
      validate: ({ operation, resolvedFieldData, addValidationError }) => {
        if (operation !== 'delete' && resolvedFieldData === rejectedUpload) {
          addValidationError(invalidImage)
        }
      },
    },
  })
}
