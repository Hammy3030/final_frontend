import { motion } from 'framer-motion';
import { Star, Coins, Stamp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const GamificationBar = ({ stars, coins, stamps }) => {
    const { user } = useAuth();

    if (!user || user.role !== 'student') return null;

    const displayStars = stars !== undefined ? stars : (user.stars || 0);
    const displayCoins = coins !== undefined ? coins : (user.coins || 0);
    const displayStamps = stamps !== undefined ? stamps : (user.stamps || 0);

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white shadow-md rounded-b-xl border-t-0 border-x border-b border-yellow-200 mx-4 md:mx-auto max-w-4xl px-6 py-3 flex justify-around items-center sticky top-0 z-40"
        >
            {/* Stars */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">ดาวสะสม</p>
                    <p className="text-xl font-bold text-gray-800">{displayStars}</p>
                </div>
            </div>

            {/* Coins */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-full">
                    <Coins className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">เหรียญทอง</p>
                    <p className="text-xl font-bold text-gray-800">{displayCoins}</p>
                </div>
            </div>

            {/* Stamps */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                    <Stamp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">แสตมป์</p>
                    <p className="text-xl font-bold text-gray-800">{displayStamps}</p>
                </div>
            </div>
        </motion.div>
    );
};

export default GamificationBar;
