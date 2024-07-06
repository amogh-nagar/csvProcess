# Image Processing System

System to efficiently process image data from CSV files.

# Components
Components are:
<ul>
    <li>Image Processing Service Interaction: Integrate with the async image processing service </li>
    <li>Webhook Handling: Process callbacks from the image processing service.</li>
    <li>Database Interaction: Store and track the status of each processing request.</li>
    <li>
        <ul>
            API Endpoints:
            <li>Upload API: Accept CSV files and return a unique request ID.</li>
            <li>Status API: Check the processing status using the request ID.</li>
        </ul>
    </li>
</ul>
