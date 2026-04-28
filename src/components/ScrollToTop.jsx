import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  // Mengambil informasi URL saat ini
  const { pathname } = useLocation();

  useEffect(() => {
    // Menarik layar ke koordinat X: 0, Y: 0 (paling atas)
    // secara instan setiap kali 'pathname' (halaman) berubah
    window.scrollTo(0, 0);
    
    // Opsional: Jika Anda ingin efek meluncur perlahan ke atas, 
    // hapus baris di atas dan gunakan baris di bawah ini:
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  // Komponen ini tidak menampilkan wujud visual apa pun
  return null; 
}