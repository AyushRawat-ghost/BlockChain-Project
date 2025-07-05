import { Input } from "./ui/input";
import { motion } from "framer-motion";

const Search = () => {
    return (
        <header className="w-full flex flex-col items-center py-10 bg-gradient-to-br from-primary to-secondary rounded-b-3xl shadow-lg animate-fade-in">
            <motion.h2 
                className="text-3xl md:text-4xl font-bold text-light mb-6 drop-shadow-lg tracking-tight"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
            >
                Search it. Explore it. Buy it.
            </motion.h2>
            <Input
                type="text"
                className="w-full max-w-xl px-6 py-4 rounded-xl border-none shadow-xl text-lg focus:ring-4 focus:ring-accent/40 transition-all bg-white/90 placeholder-gray"
                placeholder="Enter an address, neighborhood, city, or ZIP code"
            />
        </header>
    );
}

export default Search;