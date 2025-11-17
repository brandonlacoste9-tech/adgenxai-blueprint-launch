import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { BRAND_IDENTITY } from "@/lib/constants";

const Footer = () => {
  return (
    <footer className="relative bg-foreground/90 backdrop-blur-xl text-background py-16 border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>{BRAND_IDENTITY.emoji}</span>
              <span>{BRAND_IDENTITY.name}</span>
            </h3>
            <p className="text-background/80 mb-6">{BRAND_IDENTITY.shortDescription}</p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-colors border border-white/20">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Features</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Pricing</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Integrations</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">API</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">About Us</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Careers</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Blog</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Documentation</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Help Center</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Case Studies</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Community</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/80 text-sm">
            © {new Date().getFullYear()} {BRAND_IDENTITY.name}. All rights reserved.
          </p>
          <p className="text-background/80 text-sm">
            Contact: <a href={BRAND_IDENTITY.contactHref} className="underline hover:text-background">{BRAND_IDENTITY.contactEmail}</a>
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-background/80 hover:text-background transition-colors">Privacy Policy</a>
            <a href="#" className="text-background/80 hover:text-background transition-colors">Terms of Service</a>
            <a href="#" className="text-background/80 hover:text-background transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
