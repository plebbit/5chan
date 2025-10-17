package 5chan.android;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.PluginCall;
import androidx.activity.result.ActivityResult;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

@CapacitorPlugin(name = "FileUploader")
public class FileUploaderPlugin extends Plugin {
    private static final String TAG = "FileUploaderPlugin";

    @PluginMethod
    public void pickAndUploadMedia(PluginCall call) {
        Log.d(TAG, "pickAndUploadMedia called");
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*");
        String[] mimeTypes = {"image/jpeg", "image/png", "video/mp4", "video/webm"};
        intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        startActivityForResult(call, intent, "pickFileResult");
    }

    @ActivityCallback
    private void pickFileResult(PluginCall call, ActivityResult result) {
        Log.d(TAG, "pickFileResult callback received");
        if (call == null) {
            return;
        }

        if (result.getResultCode() == Activity.RESULT_OK) {
            Intent data = result.getData();
            if (data != null) {
                Uri uri = data.getData();
                uploadToCatbox(uri, call);
            } else {
                call.reject("No data received");
            }
        } else {
            call.reject("File selection cancelled");
        }
    }

    private void uploadToCatbox(Uri fileUri, PluginCall call) {
        new Thread(() -> {
            try {
                Log.d(TAG, "Starting file conversion from URI");
                File file = FileUtils.getFileFromUri(getContext(), fileUri);
                Log.d(TAG, "File name: " + file.getName());
                
                JSObject statusUpdate = new JSObject();
                statusUpdate.put("status", "Uploading to catbox.moe...");
                notifyListeners("uploadStatus", statusUpdate);
                
                OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(30, TimeUnit.SECONDS)
                    .writeTimeout(30, TimeUnit.SECONDS)
                    .readTimeout(30, TimeUnit.SECONDS)
                    .build();

                RequestBody requestBody = new MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart("reqtype", "fileupload")
                    .addFormDataPart("fileToUpload", file.getName(),
                        RequestBody.create(MediaType.parse("application/octet-stream"), file))
                    .build();

                Request request = new Request.Builder()
                    .url("https://catbox.moe/user/api.php")
                    .post(requestBody)
                    .build();

                try (Response response = client.newCall(request).execute()) {
                    if (!response.isSuccessful()) throw new IOException("Unexpected response " + response);
                    
                    String url = response.body().string();
                    Log.d(TAG, "Upload successful. URL: " + url);
                    
                    JSObject ret = new JSObject();
                    ret.put("url", url);
                    ret.put("fileName", file.getName());
                    ret.put("status", "Upload complete!");
                    call.resolve(ret);
                }
            } catch (Exception e) {
                Log.e(TAG, "Upload failed", e);
                call.reject("Upload failed: " + e.getMessage());
            }
        }).start();
    }
}