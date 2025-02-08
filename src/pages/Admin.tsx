import { AdminPortal } from "@/components/AdminPortal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Admin() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <AdminPortal />
      </main>
      <Footer />
    </div>
  );
}
