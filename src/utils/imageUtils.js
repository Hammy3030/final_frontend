/**
 * Utility for image compression to stay within Vercel's 4.5MB payload limit
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Check size (base64 is ~33% larger than binary)
        // 3.5MB in base64 is roughly 2.6MB binary. Vercel limit is 4.5MB total.
        const sizeInBytes = Math.floor((compressedBase64.length * 3) / 4);
        const sizeInMB = sizeInBytes / (1024 * 1024);

        if (sizeInMB > 3.5) {
          reject(new Error('รูปภาพมีขนาดใหญ่เกินไป แม้จะบีบอัดแล้ว กรุณาเลือกรูปอื่น'));
        } else {
          resolve(compressedBase64);
        }
      };
      img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้'));
    };
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
  });
};
