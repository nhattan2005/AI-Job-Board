require('dotenv').config(); // Đọc file .env
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ LỖI: Không tìm thấy GEMINI_API_KEY trong file .env!");
    console.error("👉 Hãy kiểm tra lại file .env trong thư mục server.");
    process.exit(1);
}

console.log(`🔑 Đang kiểm tra API Key: ${apiKey.substring(0, 10)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        const response = JSON.parse(data);
        
        if (res.statusCode !== 200) {
            console.error(`\n❌ KẾT NỐI THẤT BẠI (Mã lỗi: ${res.statusCode})`);
            console.error("👉 Nguyên nhân:", response.error ? response.error.message : response);
            console.error("\n💡 GIẢI PHÁP:");
            console.error("1. Nếu lỗi 'API key not valid': Bạn đã copy sai Key.");
            console.error("2. Nếu lỗi 'User location is not supported': Hãy đổi VPN hoặc tạo Key mới.");
            console.error("3. Nếu lỗi 404/403 khác: Key này có thể là của Google Cloud (Vertex AI) chứ không phải AI Studio.");
        } else {
            console.log("\n✅ KẾT NỐI THÀNH CÔNG! Danh sách Model bạn được dùng:");
            console.log("------------------------------------------------");
            if (response.models) {
                response.models.forEach(m => {
                    // Chỉ in ra các model tạo nội dung (generateContent)
                    if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                        console.log(`- ${m.name.replace('models/', '')}`);
                    }
                });
                console.log("------------------------------------------------");
                console.log("👉 Hãy dùng một trong các tên ở trên để đưa vào code.");
            } else {
                console.log("⚠️ Không tìm thấy model nào. Key này có vấn đề lạ.");
            }
        }
    });
}).on('error', (err) => {
    console.error("❌ Lỗi mạng:", err.message);
});