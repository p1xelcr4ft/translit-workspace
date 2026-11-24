// translitEngine.js

const MAPS = {
    // Базовый ISO 9 / Для чтения
    basic: {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"j","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya"},
    
    // Приказ МИД России № 4271 (Для загранпаспортов и ФИО)
    passport: {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i","й":"i","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"","э":"e","ю":"iu","я":"ia"},
    
    // ГОСТ 7.79-2000 (Система Б)
    gost: {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"jo","ж":"zh","з":"z","и":"i","й":"j","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"c","ч":"ch","ш":"sh","щ":"shh","ъ":"\"","ы":"y","ь":"'","э":"eh","ю":"ju","я":"ja"},
    
    // Яндекс & Google SEO стандарт (с учетом ЧПУ)
    seo: {"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya"}
};

function translit(text, mode = 'basic') {
    if (!text) return '';
    const map = MAPS[mode] || MAPS.basic;
    
    let targetText = text;
    if (mode === 'seo') {
        targetText = targetText.toLowerCase();
    }

    let result = '';
    
    for (let i = 0; i < targetText.length; i++) {
        const char = targetText[i];
        const lowerChar = char.toLowerCase();
        
        if (mode === 'seo' && (char === ' ' || char === '-' || char === '_')) {
            if (result[result.length - 1] !== '-') {
                result += '-';
            }
            continue;
        }

        if (map[lowerChar] !== undefined) {
            const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
            let translitChar = map[lowerChar];
            
            if (isUpper && mode !== 'seo') {
                translitChar = translitChar.charAt(0).toUpperCase() + translitChar.slice(1);
            }
            result += translitChar;
        } else {
            if (mode === 'seo') {
                if (/[a-z0-9\-]/.test(lowerChar)) {
                    result += char;
                }
            } else {
                result += char;
            }
        }
    }
    
    if (mode === 'seo') {
        result = result.replace(/^-+|-+$/g, '');
    }

    return result;
}

module.exports = { translit };