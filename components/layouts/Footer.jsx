import Link from "next/link";
import Button from "../ui/Button";
import Container from "../ui/Container";

const Footer = () => {
    return (
        <footer className="bg-white pt-16 pb-8 border-t border-[#E09A74] w-full">
            <Container>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-24">
                    <div className="flex flex-col gap-4 text-[#707075]">
                        <h4 className="font-medium text-lg mb-2 text-gray-900">Explore</h4>
                        <Link href="/productlist" className="hover:text-gray-800 transition-colors">Products</Link>
                        <Link href="/not-found" className="hover:text-gray-800 transition-colors">Brands</Link>
                        <Link href="/not-found" className="hover:text-gray-800 transition-colors">Boards</Link>
                        <Link href="/not-found" className="hover:text-gray-800 transition-colors">Collections</Link>
                    </div>

                    <div className="flex flex-col gap-4 text-[#707075]">
                        <h4 className="font-medium text-lg mb-2 text-gray-900">About</h4>
                        <Link href="/about" className="hover:text-gray-800 transition-colors">About</Link>
                        <Link href="/contact-us" className="hover:text-gray-800 transition-colors">Contact Us</Link>
                        <Link href="/not-found" className="hover:text-gray-800 transition-colors">How it Works</Link>
                        <Link href="/not-found" className="hover:text-gray-800 transition-colors">Blog</Link>
                        <Link href="/not-found" className="hover:text-gray-800 transition-colors">Careers</Link>
                    </div>

                    <div className="flex flex-col gap-4 text-[#707075]">
                        <h4 className="font-medium text-lg mb-2 text-gray-900">Support</h4>
                        <Link href="/not-found" className="hover:text-gray-800 transition-colors">FAQ's</Link>
                        <Link href="/help-support" className="hover:text-gray-800 transition-colors">Help and Support</Link>
                        <Link href="/not-found" className="hover:text-gray-800 transition-colors">Privacy and Legal Center</Link>
                        <Link href="/not-found" className="hover:text-gray-800 transition-colors">CA Privacy Notice</Link>
                    </div>

                    <div className="col-span-2 md:col-span-1 lg:col-span-2 lg:pl-12">
                        <h4 className="font-medium text-lg mb-4 text-gray-900">Manufacturer? Let's Talk!</h4>
                        <p className="text-[#707075] mb-6 leading-relaxed max-w-sm">
                            Get your products in front of 100,000+ design professionals who are actively sourcing materials for their projects
                        </p>
                        <Button
                            text="Join Us"
                            href="/auth/login"
                            className="bg-[#4D4E58] text-white hover:bg-black px-8 py-3 rounded-full font-medium cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100">
                    <p className="text-[#707075] text-sm mb-4 md:mb-0">
                        © 2025 ArcMat. All rights reserved.
                    </p>

                    <div className="flex gap-6 items-center">
                        <Link href="/not-found" className="text-[#707075] hover:text-gray-800 transition-colors text-sm">Instagram</Link>
                        <span className="text-[#707075]">•</span>
                        <Link href="/not-found" className="text-[#707075] hover:text-gray-800 transition-colors text-sm">Pinterest</Link>
                        <span className="text-[#707075]">•</span>
                        <Link href="/not-found" className="text-[#707075] hover:text-gray-800 transition-colors text-sm">Linkedin</Link>
                    </div>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
