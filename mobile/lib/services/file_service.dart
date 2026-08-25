import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:path_provider/path_provider.dart';

class FileService {
  /// Receive incoming file stream and assemble directly into device Downloads directory
  Future<String> receiveFile({
    required String transferId,
    required String fileName,
    required Stream<List<int>> dataStream,
    required String expectedSha256,
    Function(double progress, double speedMbps)? onProgress,
  }) async {
    try {
      final Directory? downloadDir = await getDownloadsDirectory() ?? await getApplicationDocumentsDirectory();
      final String stagingPath = '${downloadDir.path}/crosssync_staging_$transferId';
      final File stagingFile = File(stagingPath);

      final IOSink sink = stagingFile.openWrite();
      int receivedBytes = 0;
      final DateTime startTime = DateTime.now();

      await for (final List<int> chunk in dataStream) {
        sink.add(chunk);
        receivedBytes += chunk.length;

        if (onProgress != null) {
          final double seconds = DateTime.now().difference(startTime).inMilliseconds / 1000.0;
          final double speedMbps = seconds > 0 ? ((receivedBytes * 8) / (1024 * 1024)) / seconds : 0.0;
          onProgress(receivedBytes.toDouble(), speedMbps);
        }
      }

      await sink.flush();
      await sink.close();

      // Verify SHA256 integrity
      final List<int> fileBytes = await stagingFile.readAsBytes();
      final Digest digest = sha256.convert(fileBytes);
      final String calculatedHash = digest.toString();

      if (expectedSha256.isNotEmpty && calculatedHash != expectedSha256) {
        await stagingFile.delete();
        throw Exception('SHA-256 verification failed. File integrity compromised.');
      }

      final String finalPath = '${downloadDir.path}/$fileName';
      final File finalFile = await stagingFile.rename(finalPath);

      return finalFile.path;
    } catch (e) {
      print('[Mobile FileService] Error receiving file: $e');
      rethrow;
    }
  }

  /// Get list of all recently received files from CrossSync
  Future<List<FileSystemEntity>> getReceivedFiles() async {
    try {
      final Directory? downloadDir = await getDownloadsDirectory() ?? await getApplicationDocumentsDirectory();
      if (downloadDir == null || !downloadDir.existsSync()) {
        return [];
      }
      return downloadDir.listSync().toList();
    } catch (e) {
      print('[Mobile FileService] Error listing files: $e');
      return [];
    }
  }
}
