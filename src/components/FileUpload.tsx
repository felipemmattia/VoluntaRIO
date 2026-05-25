import { useState, useRef } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Upload, Check } from "@phosphor-icons/react";
import { toast } from "sonner";

interface FileUploadProps {
  type: "avatar" | "event" | "gallery";
  onUploadComplete?: (url: string) => void;
  label?: string;
}

export default function FileUpload({ type, onUploadComplete, label }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const saveAvatar = trpc.upload.saveAvatar.useMutation({
    onSuccess: () => {
      toast.success("Avatar atualizado com sucesso!");
      utils.auth.me.invalidate();
      if (preview && onUploadComplete) {
        onUploadComplete(preview);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = {
      avatar: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      event: ["image/jpeg", "image/png", "image/webp"],
      gallery: ["image/jpeg", "image/png", "image/webp"],
    };

    if (!allowedTypes[type].includes(file.type)) {
      toast.error("Tipo de arquivo nao permitido. Use JPG, PNG ou WebP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Maximo 5MB.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/upload/${type}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          setPreview(response.url);
          toast.success("Upload realizado com sucesso!");

          if (type === "avatar") {
            saveAvatar.mutate({ imageUrl: response.url });
          }

          if (onUploadComplete) {
            onUploadComplete(response.url);
          }
        } else {
          const error = JSON.parse(xhr.responseText);
          toast.error(error.error || "Erro no upload");
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        toast.error("Erro de conexao no upload");
      };

      xhr.send(formData);
    } catch {
      setUploading(false);
      toast.error("Erro ao processar upload");
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="gap-2"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            {progress}%
          </>
        ) : (
          <>
            <Upload weight="duotone" className="h-4 w-4" />
            {label ?? "Upload"}
          </>
        )}
      </Button>

      {preview && (
        <div className="flex items-center gap-2 text-sm text-success">
          <Check weight="duotone" className="h-4 w-4" />
          Upload concluido
        </div>
      )}
    </div>
  );
}
