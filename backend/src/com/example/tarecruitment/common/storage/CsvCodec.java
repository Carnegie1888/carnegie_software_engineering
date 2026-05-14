package com.example.tarecruitment.common.storage;

import java.util.regex.Pattern;

/**
 * Shared CSV escaping/parsing for the file-backed stores.
 */
public final class CsvCodec {

    private static final Pattern CSV_SPLIT_PATTERN = Pattern.compile(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");

    private CsvCodec() {
    }

    public static String escape(String value) {
        String text = value == null ? "" : value;
        if (text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }

    public static String unescape(String value) {
        if (value == null) {
            return "";
        }
        String text = value;
        if (text.startsWith("\"") && text.endsWith("\"") && text.length() >= 2) {
            text = text.substring(1, text.length() - 1).replace("\"\"", "\"");
        }
        return text;
    }

    public static String[] split(String csvLine) {
        if (csvLine == null) {
            return new String[0];
        }
        return CSV_SPLIT_PATTERN.split(csvLine, -1);
    }
}
