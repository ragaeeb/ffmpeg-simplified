[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/e8859a7e-7cfc-4447-a7c0-965229145506.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/e8859a7e-7cfc-4447-a7c0-965229145506) [![Node.js CI](https://github.com/ragaeeb/ffmpeg-simple/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/ffmpeg-simple/actions/workflows/build.yml) ![GitHub License](https://img.shields.io/github/license/ragaeeb/ffmpeg-simple) ![GitHub Release](https://img.shields.io/github/v/release/ragaeeb/ffmpeg-simple) [![codecov](https://codecov.io/gh/ragaeeb/ffmpeg-simple/graph/badge.svg?token=6B40XM3HNB)](https://codecov.io/gh/ragaeeb/ffmpeg-simple) [![Size](https://deno.bundlejs.com/badge?q=ffmpeg-simple@1.0.0)](https://bundlejs.com/?q=ffmpeg-simple%401.0.0) ![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue) ![npm](https://img.shields.io/npm/v/ffmpeg-simple) ![npm](https://img.shields.io/npm/dm/ffmpeg-simple) ![GitHub issues](https://img.shields.io/github/issues/ragaeeb/ffmpeg-simple) ![GitHub stars](https://img.shields.io/github/stars/ragaeeb/ffmpeg-simple?style=social)

[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=coverage)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=bugs)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=ragaeeb_ffmpeg-simple&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=ragaeeb_ffmpeg-simple)

# ffmpeg-simple

JavaScript SDK for accessing the books and resources provided by turath.io. This SDK allows you to interact with the turath.io API to retrieve book information, author details, specific pages, and perform searches across the database.

## Installation

To install ffmpeg-simple, use npm or yarn:

```bash
npm install ffmpeg-simple
# or
yarn add ffmpeg-simple
# or
pnpm i ffmpeg-simple
```

## Requirements

Node.js >= `20.0.0`

## Usage

The SDK provides several functions to interact with the turath.io API. Below are the main functions that you can use:

### Importing the SDK

```javascript
import { getBookInfo } from "ffmpeg-simple";
```

### 1. getAuthor

Fetches information about an author by their ID.

```typescript
import { getAuthor } from "ffmpeg-simple";

(async () => {
  try {
    const author = await getAuthor(44);
    console.log(author);
  } catch (error) {
    console.error(error.message);
  }
})();
```

Parameters:

`id` (`number`): The unique identifier of the author.

Returns: A promise that resolves to the author's information.

Throws: Will throw an error if the author is not found.

### 2. `getBookFile`

Fetches the JSON file of a book by its ID.

```typescript
import { getBookFile } from "ffmpeg-simple";

(async () => {
  try {
    const bookFile = await getBookFile(147927);
    console.log(bookFile);
  } catch (error) {
    console.error(error.message);
  }
})();
```

Parameters:

`id` (`number`): The unique identifier of the book.

Returns: A promise that resolves to the book file information.

Throws: Will throw an error if the book file is not found.

### 3. `getBookInfo`

Fetches the information about a book, including its metadata and indexes.

```typescript
import { getBookInfo } from "ffmpeg-simple";

(async () => {
  const bookInfo = await getBookInfo(147927);
  console.log(bookInfo);
})();
```

Parameters:

`id` (`number`): The unique identifier of the book.

Returns: A promise that resolves to the book information including indexes.

### 4. `getPage`

Fetches a specific page from a book by its book ID and page number.

```typescript
import { getPage } from "ffmpeg-simple";

(async () => {
  try {
    const page = await getPage(147927, 5);
    console.log(page);
  } catch (error) {
    console.error(error.message);
  }
})();
```

Parameters:

`bookId` (`number`): The unique identifier of the book.

`pageNumber` (`number`): The page number to retrieve.

Returns: A promise that resolves to the page metadata and text.

Throws: Will throw an error if the page is not found.

### 5. `search`

Searches for books or content using a query string.

```typescript
import { search } from "ffmpeg-simple";

(async () => {
  const results = await search("الإسلام", { category: 6 });
  console.log(results);
})();
```

Parameters:

`query` (`string`): The search query string.

`options` (`SearchOptions`, optional): Additional search options such as category or sorting field.

Returns: A promise that resolves to the search results, including count and data.

## Contributing

If you'd like to contribute to the SDK, feel free to fork the repository and submit a pull request. Contributions are welcome!

## License

This SDK is licensed under the MIT License.
