// Ждем, пока вся HTML-структура страницы будет загружена
document.addEventListener('DOMContentLoaded', () => {
    
    // Находим главные контейнеры в HTML, куда будем вставлять контент
    const articleHeader = document.getElementById('article-header');
    const articleBody = document.getElementById('article-body');
    
    // 1. Получаем параметры из URL-адреса
    const params = new URLSearchParams(window.location.search);
    
    // 2. Ищем параметр с именем 'article'. Это имя мы используем в ссылках (href="...html?article=...")
    const articleName = params.get('article');
    
    console.log('Скрипт пытается загрузить статью с именем:', articleName); 

    // 3. Если в URL есть имя статьи, формируем путь и загружаем ее
    if (articleName) {
        // Формируем путь к JSON-файлу. Он лежит в той же папке, что и HTML-шаблон.
        const pathToArticle = `${articleName}.json`;

        fetch(pathToArticle)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}, не удалось найти файл ${pathToArticle}`);
                }
                return response.json();
            })
            .then(data => {
                renderArticle(data);
            })
            .catch(error => {
                console.error('Ошибка при загрузке статьи:', error);
                articleBody.innerHTML = `<p style="color: red;">Не удалось загрузить статью. Убедитесь, что файл <b>${pathToArticle}</b> существует.</p>`;
            });
    } else {
        // 4. Если в URL не указана статья, выводим сообщение
        articleHeader.innerHTML = '<h1>Ошибка</h1>';
        articleBody.innerHTML = '<p>Не выбрана статья для отображения. Пожалуйста, перейдите по ссылке со списком статей.</p>';
    }
        
    // Вспомогательная функция для рендеринга текста
    const renderContent = (content) => {
	if (Array.isArray(content)) {
	    return content.join(' ');
	}
	return content;
    };

    // Главная функция, которая "рисует" статью на основе данных из JSON
    function renderArticle(data) {

        // Принимает на вход строку или массив строк и всегда возвращает одну готовую строку HTML.
        const renderContent = (content) => {
            if (Array.isArray(content)) {
                return content.join(' '); // Соединяем массив строк через пробел
            }
            return content; // Если это уже строка, просто возвращаем ее
        };
        
        // 1. Устанавливаем заголовок страницы (вкладки браузера)
        document.title = data.title;

        // 2. Создаем и вставляем главный заголовок статьи (H1)
        const mainTitle = document.createElement('h1');
        mainTitle.textContent = data.title;
        articleHeader.appendChild(mainTitle);

        // 3. Создаем и вставляем заглавную картинку
        if (data.heroImage) {
            const figure = document.createElement('figure');
            figure.className = 'hero-image';
            
            const img = document.createElement('img');
            img.src = data.heroImage.url;
            img.alt = data.heroImage.alt;
            
            const figcaption = document.createElement('figcaption');
            figcaption.textContent = data.heroImage.caption;

            figure.appendChild(img);
            figure.appendChild(figcaption);
            articleBody.appendChild(figure);
        }

        // 4. Проходим по каждому элементу в массиве "body" и создаем соответствующий HTML-блок
        data.body.forEach(block => {
            let element;
            switch (block.type) {
                case 'paragraph':
                    element = document.createElement('p');
                    element.innerHTML = renderContent(block.content);
                    break;
                
                case 'heading':
                    element = document.createElement(`h${block.level}`);
                    element.textContent = block.content;
                    break;

                case 'definition':
                    element = document.createElement('dl');
                    element.innerHTML = `<dt>${block.term}</dt><dd>${renderContent(block.definition)}</dd>`;
                    break;

                case 'quote':
                    element = document.createElement('blockquote');
                    element.innerHTML = `<p>${renderContent(block.text)}</p><footer>${block.author}</footer>`;
                    break;

                case 'list':
                    element = document.createElement('ul');
                    block.items.forEach(item => {
                        const li = document.createElement('li');
                        // Применяем renderContent к каждому элементу списка
                        li.innerHTML = renderContent(item);
                        element.appendChild(li);
                    });
                    break;

                case 'table':
                    element = document.createElement('table');
                    const thead = `<thead><tr>${block.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
                    const tbody = `<tbody>${block.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>`;
                    element.innerHTML = thead + tbody;
                    break;

                case 'case':
                    element = document.createElement('div');
                    element.className = 'case-block';
                    const caseContent = renderContent(block.content);
                    element.innerHTML = `<h4 class="case-title">${block.title}</h4><p>${caseContent}</p>`;
                    break;
                
                case 'dialogue':
                    element = document.createElement('div');
                    element.className = 'dialogue-block';
                    block.entries.forEach(entry => {
                        const entryDiv = document.createElement('div');
                        entryDiv.className = 'dialogue-entry';
                        // Применяем renderContent к реплике диалога
                        const lineContent = renderContent(entry.line);
                        entryDiv.innerHTML = `<span class="speaker">${entry.speaker}</span><p>${lineContent}</p>`;
                        element.appendChild(entryDiv);
                    });
                    break;
            }
            if (element) {
                articleBody.appendChild(element); // Добавляем созданный элемент на страницу
            }
        });
    }
});
