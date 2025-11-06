import React from 'react';
import { useDebug } from '../../contexts/DebugContext';
import { X, Bug } from 'lucide-react';
import { Button } from './Button';

const DebugPanel: React.FC = () => {
    const { isOpen, togglePanel, debugData } = useDebug();

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] w-full max-w-md bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-2xl">
            <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-indigo-500" />
                    <h3 className="font-semibold text-lg">Debug Panel</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={togglePanel} className="p-1 h-auto">
                    <X className="h-5 w-5" />
                </Button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-md">
                    <code>
                        {JSON.stringify(debugData, null, 2)}
                    </code>
                </pre>
            </div>
             <div className="p-2 border-t dark:border-gray-700 text-center">
                <p className="text-xs text-gray-400">Press Ctrl/Cmd + D to toggle</p>
            </div>
        </div>
    );
};

export default DebugPanel;
