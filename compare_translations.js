import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取翻译文件
const readTranslationFile = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return {};
    }
};

// 获取所有键
const getAllKeys = (obj, prefix = '') => {
    let keys = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(getAllKeys(obj[key], prefix ? `${prefix}.${key}` : key));
        } else {
            keys.push(prefix ? `${prefix}.${key}` : key);
        }
    }
    return keys;
};

// 比较两个翻译文件
const compareTranslations = (enTranslations, zhTranslations) => {
    const enKeys = Object.keys(enTranslations);
    const zhKeys = Object.keys(zhTranslations);
    
    // 找出缺失的键
    const missingKeys = enKeys.filter(key => !zhKeys.includes(key));
    
    return {
        enKeysCount: enKeys.length,
        zhKeysCount: zhKeys.length,
        missingKeysCount: missingKeys.length,
        missingKeys: missingKeys
    };
};

// 主函数
const main = () => {
    const basePath = path.join(__dirname, 'src', 'lib', 'i18n', 'locales');
    
    const enFilePath = path.join(basePath, 'en-US', 'translation.json');
    const zhFilePath = path.join(basePath, 'zh-CN', 'translation.json');
    
    const enTranslations = readTranslationFile(enFilePath);
    const zhTranslations = readTranslationFile(zhFilePath);
    
    const result = compareTranslations(enTranslations, zhTranslations);
    
    console.log('Translation Comparison Result:');
    console.log(`English keys count: ${result.enKeysCount}`);
    console.log(`Chinese keys count: ${result.zhKeysCount}`);
    console.log(`Missing keys count: ${result.missingKeysCount}`);
    
    if (result.missingKeysCount > 0) {
        console.log('\nMissing keys:');
        result.missingKeys.forEach((key, index) => {
            console.log(`${index + 1}. ${key}`);
        });
    }
    
    // 将缺失的键写入文件
    const missingKeysFilePath = path.join(__dirname, 'missing_translations.txt');
    fs.writeFileSync(missingKeysFilePath, result.missingKeys.join('\n'), 'utf8');
    console.log(`\nMissing keys have been written to: ${missingKeysFilePath}`);
    
    // 将缺失的键及其英文值写入JSON文件
    const missingTranslations = {};
    result.missingKeys.forEach(key => {
        missingTranslations[key] = enTranslations[key];
    });
    
    const missingTranslationsFilePath = path.join(__dirname, 'missing_translations.json');
    fs.writeFileSync(missingTranslationsFilePath, JSON.stringify(missingTranslations, null, 2), 'utf8');
    console.log(`Missing translations have been written to: ${missingTranslationsFilePath}`);
};

main();