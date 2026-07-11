import { useState } from "react";
import { useAdminStore } from "../store/adminStore";
import toast from "react-hot-toast";

function FileUpload({ label, accept, onChange, currentValue }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentValue || "");
  const uploadFile = useAdminStore((s) => s.uploadFile);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const result = await uploadFile(file);
    setUploading(false);

    if (result.success) {
      setPreview(result.url);
      onChange(result.url);
      toast.success(`${label} uploaded`);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700"
        disabled={uploading}
      />
      {uploading && <p className="text-sm text-yellow-400 mt-1">Uploading...</p>}
      {preview && (
        <div className="mt-2">
          {accept?.includes("video") ? (
            <video src={preview} className="w-48 rounded" controls />
          ) : (
            <img src={preview} alt={label} className="w-32 rounded" />
          )}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
