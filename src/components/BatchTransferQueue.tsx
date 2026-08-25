import React, { useRef } from 'react';
import { 
  CheckSquare, 
  Square, 
  Play, 
  Pause, 
  X, 
  Trash2, 
  Layers, 
  Plus, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Activity, 
  FileText, 
  Image as ImageIcon, 
  Archive, 
  Film, 
  FileCode, 
  UploadCloud,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
import { syncEngine } from '../services/syncEngine';
import { TransferQueueItem, QueueItemStatus, formatBytes, formatSpeed } from '../../shared/protocol';

interface Props {
  platform: 'windows' | 'android';
  compact?: boolean;
}

export const BatchTransferQueue: React.FC<Props> = ({ platform, compact = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queue = syncEngine.fileQueue;
  const selectedIds = syncEngine.selectedQueueIds;

  const selectedCount = selectedIds.size;
  const totalCount = queue.length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  // Aggregate metrics
  const selectedItems = queue.filter(item => selectedIds.has(item.id));
  const activeItemsToCalculate = selectedCount > 0 ? selectedItems : queue;
  const totalSizeBytes = activeItemsToCalculate.reduce((acc, item) => acc + item.fileSizeBytes, 0);
  
  const transferringCount = queue.filter(i => i.status === 'transferring').length;
  const pausedCount = queue.filter(i => i.status === 'paused').length;
  const queuedCount = queue.filter(i => i.status === 'queued').length;
  const completedCount = queue.filter(i => i.status === 'completed').length;

  const handleMultipleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray: File[] = Array.from(e.target.files);
      syncEngine.addFilesToQueue(filesArray, platform, false);
      e.target.value = '';
    }
  };

  const getMimeIcon = (mime: string, name: string) => {
    if (mime.includes('image') || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(name)) {
      return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    }
    if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || /\.(zip|tar|gz|7z)$/i.test(name)) {
      return <Archive className="w-4 h-4 text-amber-400" />;
    }
    if (mime.includes('video') || /\.(mp4|mkv|mov|webm)$/i.test(name)) {
      return <Film className="w-4 h-4 text-purple-400" />;
    }
    if (mime.includes('javascript') || mime.includes('json') || mime.includes('python') || /\.(ts|tsx|js|json|rs|dart)$/i.test(name)) {
      return <FileCode className="w-4 h-4 text-cyan-400" />;
    }
    return <FileText className="w-4 h-4 text-blue-400" />;
  };

  const getStatusBadge = (status: QueueItemStatus) => {
    switch (status) {
      case 'transferring':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
            <Activity className="w-3 h-3 animate-spin text-cyan-400" /> SENDING
          </span>
        );
      case 'paused':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Pause className="w-3 h-3 text-amber-400" /> PAUSED
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> DONE
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <X className="w-3 h-3 text-rose-400" /> CANCELLED
          </span>
        );
      case 'queued':
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-400" /> QUEUED
          </span>
        );
    }
  };

  return (
    <div id={`${platform}-batch-queue-container`} className="flex flex-col h-full bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-3">
      
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleMultipleFiles}
        className="hidden"
      />

      {/* Header & Status Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white tracking-wide">Batch Transfer Queue</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                {queue.length} items ({formatBytes(totalSizeBytes)})
              </span>
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
              {transferringCount > 0 && <span className="text-cyan-300 font-bold">{transferringCount} active</span>}
              {pausedCount > 0 && <span className="text-amber-300">{pausedCount} paused</span>}
              {queuedCount > 0 && <span className="text-blue-300">{queuedCount} waiting</span>}
              {completedCount > 0 && <span className="text-emerald-300">{completedCount} completed</span>}
            </div>
          </div>
        </div>

        {/* Action buttons: Add files & Stage Demo */}
        <div className="flex items-center gap-1.5">
          <button
            id={`${platform}-stage-sample-batch-btn`}
            onClick={() => syncEngine.stageSampleBatch(platform)}
            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 flex items-center gap-1 transition-all"
            title="Add 4 sample files to test batch actions"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Sample Batch</span>
          </button>

          <button
            id={`${platform}-add-files-btn`}
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black flex items-center gap-1 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Files</span>
          </button>
        </div>
      </div>

      {/* Collective Batch Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-[#0B0F19] border border-white/10 text-xs">
        
        {/* Select All Checkbox */}
        <div className="flex items-center gap-2">
          <button
            id={`${platform}-toggle-select-all-btn`}
            onClick={() => allSelected ? syncEngine.deselectAllQueueItems() : syncEngine.selectAllQueueItems()}
            className="flex items-center gap-1.5 text-gray-300 hover:text-white font-medium text-[11px]"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : selectedCount > 0 ? (
              <div className="w-4 h-4 rounded border border-cyan-400 bg-cyan-500/30 flex items-center justify-center">
                <div className="w-2 h-0.5 bg-cyan-300" />
              </div>
            ) : (
              <Square className="w-4 h-4 text-gray-500" />
            )}
            <span>{selectedCount > 0 ? `${selectedCount} Selected` : 'Select All'}</span>
          </button>
        </div>

        {/* Batch Action Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Send Selected */}
          <button
            id={`${platform}-batch-send-btn`}
            onClick={() => syncEngine.sendSelectedQueueItems()}
            disabled={queue.length === 0}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition-all"
            title="Start transferring selected items"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Send {selectedCount > 0 ? `(${selectedCount})` : 'All'}</span>
          </button>

          {/* Pause Selected */}
          <button
            id={`${platform}-batch-pause-btn`}
            onClick={() => syncEngine.pauseSelectedQueueItems()}
            disabled={queue.length === 0 || (transferringCount === 0 && queuedCount === 0)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition-all"
            title="Pause transferring items"
          >
            <Pause className="w-3 h-3" />
            <span>Pause</span>
          </button>

          {/* Resume Selected */}
          <button
            id={`${platform}-batch-resume-btn`}
            onClick={() => syncEngine.resumeSelectedQueueItems()}
            disabled={pausedCount === 0}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition-all"
            title="Resume paused transfers"
          >
            <RotateCw className="w-3 h-3" />
            <span>Resume</span>
          </button>

          {/* Cancel Selected */}
          <button
            id={`${platform}-batch-cancel-btn`}
            onClick={() => syncEngine.cancelSelectedQueueItems()}
            disabled={queue.length === 0}
            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition-all"
            title="Cancel selected transfers"
          >
            <X className="w-3 h-3" />
            <span>Cancel</span>
          </button>

          {/* Clear Completed / Delete */}
          {completedCount > 0 ? (
            <button
              id={`${platform}-batch-clear-done-btn`}
              onClick={() => syncEngine.clearCompletedQueue()}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center gap-1 transition-all"
              title="Clear completed and cancelled items"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clean</span>
            </button>
          ) : selectedCount > 0 ? (
            <button
              id={`${platform}-batch-remove-btn`}
              onClick={() => syncEngine.removeSelectedQueueItems()}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-rose-300 border border-white/10 flex items-center gap-1 transition-all"
              title="Remove selected from queue"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Queue Items List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[140px] max-h-[300px]">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl text-gray-500">
            <UploadCloud className="w-8 h-8 mb-2 opacity-30 text-cyan-400" />
            <p className="text-xs text-gray-300 font-medium">Queue is empty</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Click &quot;Add Files&quot; or &quot;Sample Batch&quot; to stage files</p>
          </div>
        ) : (
          queue.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isTransferring = item.status === 'transferring';

            return (
              <div
                key={item.id}
                id={`queue-item-${item.id}`}
                className={`p-2.5 rounded-xl border transition-all flex flex-col gap-2 ${
                  isSelected 
                    ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm' 
                    : 'bg-black/30 border-white/5 hover:border-white/15'
                }`}
              >
                {/* Top row: Checkbox, Icon, Title, Status Badge */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      onClick={() => syncEngine.toggleSelectQueueItem(item.id)}
                      className="text-gray-400 hover:text-white flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-600" />
                      )}
                    </button>

                    <div className="p-1.5 rounded-lg bg-white/5 flex-shrink-0">
                      {getMimeIcon(item.mimeType, item.fileName)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-200 truncate">{item.fileName}</span>
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 flex items-center gap-2 mt-0.5">
                        <span>{formatBytes(item.fileSizeBytes)}</span>
                        {isTransferring && item.speedBytesPerSec > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-300 font-bold">{formatSpeed(item.speedBytesPerSec)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Status and item actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(item.status)}

                    {/* Quick item action triggers */}
                    <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                      {item.status === 'queued' || item.status === 'paused' ? (
                        <button
                          onClick={() => syncEngine.sendSelectedQueueItems([item.id])}
                          className="p-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300"
                          title="Start"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                      ) : item.status === 'transferring' ? (
                        <button
                          onClick={() => syncEngine.pauseSelectedQueueItems([item.id])}
                          className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300"
                          title="Pause"
                        >
                          <Pause className="w-3 h-3" />
                        </button>
                      ) : null}

                      {item.status !== 'completed' && (
                        <button
                          onClick={() => syncEngine.cancelSelectedQueueItems([item.id])}
                          className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar (shown if transferring or paused or completed) */}
                {(item.progressPercentage > 0 || isTransferring) && (
                  <div className="w-full space-y-1 pt-0.5">
                    <div className="flex justify-between text-[10px] font-mono text-gray-400">
                      <span>AES-256 Chunks Encrypted</span>
                      <span className="text-cyan-300 font-bold">{item.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-100 rounded-full ${
                          item.status === 'completed'
                            ? 'bg-emerald-400'
                            : item.status === 'paused'
                            ? 'bg-amber-400'
                            : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                        }`}
                        style={{ width: `${item.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
