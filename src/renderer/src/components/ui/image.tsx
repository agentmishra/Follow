import { useToast } from "@renderer/components/ui/use-toast"
import { client } from "@renderer/lib/client"
import { getProxyUrl } from "@renderer/lib/img-proxy"
import { showNativeMenu } from "@renderer/lib/native-menu"
import { cn } from "@renderer/lib/utils"
import type { FC, ImgHTMLAttributes } from "react"
import { memo, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { usePreviewImages } from "./image/hooks"

const failedList = new Set<string | undefined>()
export type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  proxy?: {
    width: number
    height: number
  }
  disableContextMenu?: boolean
  popper?: boolean
}
const ImageImpl: FC<ImageProps> = ({
  className,
  proxy,
  disableContextMenu,
  popper = false,
  ...props
}) => {
  const { src, ...rest } = props
  const [hidden, setHidden] = useState(!src)
  const [imgSrc, setImgSrc] = useState(
    proxy && src && !failedList.has(src) ?
      getProxyUrl({
        url: src,
        width: proxy.width,
        height: proxy.height,
      }) :
      src,
  )

  const errorHandle: React.ReactEventHandler<HTMLImageElement> =
    useEventCallback((e) => {
      if (imgSrc !== props.src) {
        setImgSrc(props.src)
        failedList.add(props.src)
      } else {
        setHidden(true)
        props.onError?.(e)
      }
    })
  const previewImages = usePreviewImages()
  const handleClick = useEventCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (popper && src) {
        e.stopPropagation()
        previewImages([src], 0)
      }
      props.onClick?.(e)
    },
  )
  const { toast } = useToast()

  return (
    <div className={cn("overflow-hidden rounded", className)}>
      <img
        {...rest}
        onError={errorHandle}
        className={cn(
          hidden && "hidden",
          "size-full bg-stone-100 object-cover",
        )}
        src={imgSrc}
        onClick={handleClick}
        {...(!disableContextMenu ?
            {
              onContextMenu: (e) => {
                e.stopPropagation()
                props.onContextMenu?.(e)
                showNativeMenu(
                  [
                    {
                      type: "text",
                      label: "Open Image in New Window",
                      click: () => {
                        if (props.src && imgSrc && client) {
                          window.open(props.src, "_blank")
                        }
                      },
                    },
                    {
                      type: "text",
                      label: "Copy Image Address",
                      click: () => {
                        if (props.src) {
                          navigator.clipboard.writeText(props.src)
                          toast({
                            duration: 1000,
                            description: "Address copied to clipboard.",
                          })
                        }
                      },
                    },
                  ],
                  e,
                )
              },
            } :
            {})}
      />
    </div>
  )
}

export const Image = memo(ImageImpl)
