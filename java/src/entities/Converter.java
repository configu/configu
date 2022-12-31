// To use this code, add the following Maven dependency to your project:
//
//     org.projectlombok : lombok : 1.18.2
//     com.fasterxml.jackson.core     : jackson-databind          : 2.9.0
//     com.fasterxml.jackson.datatype : jackson-datatype-jsr310   : 2.9.0
//
// Import this package:
//
//     import entities.Converter;
//
// Then you can deserialize a JSON string with
//
//     CfguType data = Converter.CfguTypeFromJsonString(jsonString);
//     Cfgu data = Converter.CfguFromJsonString(jsonString);
//     Config data = Converter.ConfigFromJsonString(jsonString);
//     ConfigSchemaType data = Converter.ConfigSchemaTypeFromJsonString(jsonString);
//     ConfigSchema data = Converter.ConfigSchemaFromJsonString(jsonString);
//     ConfigSchemaContents data = Converter.ConfigSchemaContentsValueFromJsonString(jsonString);
//     Map<String, ConfigSchemaContents> data = Converter.ConfigSchemaContentsFromJsonString(jsonString);
//     ConfigSet data = Converter.ConfigSetFromJsonString(jsonString);
//     stores.ConfigStore data = Converter.ConfigStoreFromJsonString(jsonString);
//     ConfigStoreQuery data = Converter.ConfigStoreQueryFromJsonString(jsonString);
//     ConfigStoreContents data = Converter.ConfigStoreContentsElementFromJsonString(jsonString);
//     List<ConfigStoreContents> data = Converter.ConfigStoreContentsFromJsonString(jsonString);

package entities;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.module.SimpleModule;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.time.OffsetTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.util.List;
import java.util.Map;

public class Converter {
    // Date-time helpers

    private static final DateTimeFormatter DATE_TIME_FORMATTER = new DateTimeFormatterBuilder()
            .appendOptional(DateTimeFormatter.ISO_DATE_TIME)
            .appendOptional(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
            .appendOptional(DateTimeFormatter.ISO_INSTANT)
            .appendOptional(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SX"))
            .appendOptional(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ssX"))
            .appendOptional(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
            .toFormatter()
            .withZone(ZoneOffset.UTC);

    public static OffsetDateTime parseDateTimeString(String str) {
        return ZonedDateTime.from(Converter.DATE_TIME_FORMATTER.parse(str)).toOffsetDateTime();
    }

    private static final DateTimeFormatter TIME_FORMATTER = new DateTimeFormatterBuilder()
            .appendOptional(DateTimeFormatter.ISO_TIME)
            .appendOptional(DateTimeFormatter.ISO_OFFSET_TIME)
            .parseDefaulting(ChronoField.YEAR, 2020)
            .parseDefaulting(ChronoField.MONTH_OF_YEAR, 1)
            .parseDefaulting(ChronoField.DAY_OF_MONTH, 1)
            .toFormatter()
            .withZone(ZoneOffset.UTC);

    public static OffsetTime parseTimeString(String str) {
        return ZonedDateTime.from(Converter.TIME_FORMATTER.parse(str)).toOffsetDateTime().toOffsetTime();
    }
    // Serialize/deserialize helpers

    public static CfguType CfguTypeFromJsonString(String json) throws IOException {
        return getCfguTypeObjectReader().readValue(json);
    }

    public static String CfguTypeToJsonString(CfguType obj) throws JsonProcessingException {
        return getCfguTypeObjectWriter().writeValueAsString(obj);
    }

    public static Cfgu CfguFromJsonString(String json) throws IOException {
        return getCfguObjectReader().readValue(json);
    }

    public static String CfguToJsonString(Cfgu obj) throws JsonProcessingException {
        return getCfguObjectWriter().writeValueAsString(obj);
    }

    public static Config ConfigFromJsonString(String json) throws IOException {
        return getConfigObjectReader().readValue(json);
    }

    public static String ConfigToJsonString(Config obj) throws JsonProcessingException {
        return getConfigObjectWriter().writeValueAsString(obj);
    }

    public static ConfigSchemaType ConfigSchemaTypeFromJsonString(String json) throws IOException {
        return getConfigSchemaTypeObjectReader().readValue(json);
    }

    public static String ConfigSchemaTypeToJsonString(ConfigSchemaType obj) throws JsonProcessingException {
        return getConfigSchemaTypeObjectWriter().writeValueAsString(obj);
    }

    public static ConfigSchema ConfigSchemaFromJsonString(String json) throws IOException {
        return getConfigSchemaObjectReader().readValue(json);
    }

    public static String ConfigSchemaToJsonString(ConfigSchema obj) throws JsonProcessingException {
        return getConfigSchemaObjectWriter().writeValueAsString(obj);
    }

    public static ConfigSchemaContents ConfigSchemaContentsValueFromJsonString(String json) throws IOException {
        return getConfigSchemaContentsValueObjectReader().readValue(json);
    }

    public static String ConfigSchemaContentsValueToJsonString(ConfigSchemaContents obj) throws JsonProcessingException {
        return getConfigSchemaContentsValueObjectWriter().writeValueAsString(obj);
    }

    public static Map<String, ConfigSchemaContents> ConfigSchemaContentsFromJsonString(String json) throws IOException {
        return getConfigSchemaContentsObjectReader().readValue(json);
    }

    public static String ConfigSchemaContentsToJsonString(Map<String, ConfigSchemaContents> obj) throws JsonProcessingException {
        return getConfigSchemaContentsObjectWriter().writeValueAsString(obj);
    }

    public static ConfigSet ConfigSetFromJsonString(String json) throws IOException {
        return getConfigSetObjectReader().readValue(json);
    }

    public static String ConfigSetToJsonString(ConfigSet obj) throws JsonProcessingException {
        return getConfigSetObjectWriter().writeValueAsString(obj);
    }

    public static ConfigStore ConfigStoreFromJsonString(String json) throws IOException {
        return getConfigStoreObjectReader().readValue(json);
    }

    public static String ConfigStoreToJsonString(ConfigStore obj) throws JsonProcessingException {
        return getConfigStoreObjectWriter().writeValueAsString(obj);
    }

    public static ConfigStoreQuery ConfigStoreQueryFromJsonString(String json) throws IOException {
        return getConfigStoreQueryObjectReader().readValue(json);
    }

    public static String ConfigStoreQueryToJsonString(ConfigStoreQuery obj) throws JsonProcessingException {
        return getConfigStoreQueryObjectWriter().writeValueAsString(obj);
    }

    public static ConfigStoreContents ConfigStoreContentsElementFromJsonString(String json) throws IOException {
        return getConfigStoreContentsElementObjectReader().readValue(json);
    }

    public static String ConfigStoreContentsElementToJsonString(ConfigStoreContents obj) throws JsonProcessingException {
        return getConfigStoreContentsElementObjectWriter().writeValueAsString(obj);
    }

    public static List<ConfigStoreContents> ConfigStoreContentsFromJsonString(String json) throws IOException {
        return getConfigStoreContentsObjectReader().readValue(json);
    }

    public static String ConfigStoreContentsToJsonString(List<ConfigStoreContents> obj) throws JsonProcessingException {
        return getConfigStoreContentsObjectWriter().writeValueAsString(obj);
    }

    private static ObjectReader CfguTypeReader;
    private static ObjectWriter CfguTypeWriter;

    private static void instantiateCfguTypeMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        CfguTypeReader = mapper.readerFor(CfguType.class);
        CfguTypeWriter = mapper.writerFor(CfguType.class);
    }

    private static ObjectReader getCfguTypeObjectReader() {
        if (CfguTypeReader == null) instantiateCfguTypeMapper();
        return CfguTypeReader;
    }

    private static ObjectWriter getCfguTypeObjectWriter() {
        if (CfguTypeWriter == null) instantiateCfguTypeMapper();
        return CfguTypeWriter;
    }

    private static ObjectReader CfguReader;
    private static ObjectWriter CfguWriter;

    private static void instantiateCfguMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        CfguReader = mapper.readerFor(Cfgu.class);
        CfguWriter = mapper.writerFor(Cfgu.class);
    }

    private static ObjectReader getCfguObjectReader() {
        if (CfguReader == null) instantiateCfguMapper();
        return CfguReader;
    }

    private static ObjectWriter getCfguObjectWriter() {
        if (CfguWriter == null) instantiateCfguMapper();
        return CfguWriter;
    }

    private static ObjectReader ConfigReader;
    private static ObjectWriter ConfigWriter;

    private static void instantiateConfigMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        ConfigReader = mapper.readerFor(Config.class);
        ConfigWriter = mapper.writerFor(Config.class);
    }

    private static ObjectReader getConfigObjectReader() {
        if (ConfigReader == null) instantiateConfigMapper();
        return ConfigReader;
    }

    private static ObjectWriter getConfigObjectWriter() {
        if (ConfigWriter == null) instantiateConfigMapper();
        return ConfigWriter;
    }

    private static ObjectReader ConfigSchemaTypeReader;
    private static ObjectWriter ConfigSchemaTypeWriter;

    private static void instantiateConfigSchemaTypeMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        ConfigSchemaTypeReader = mapper.readerFor(ConfigSchemaType.class);
        ConfigSchemaTypeWriter = mapper.writerFor(ConfigSchemaType.class);
    }

    private static ObjectReader getConfigSchemaTypeObjectReader() {
        if (ConfigSchemaTypeReader == null) instantiateConfigSchemaTypeMapper();
        return ConfigSchemaTypeReader;
    }

    private static ObjectWriter getConfigSchemaTypeObjectWriter() {
        if (ConfigSchemaTypeWriter == null) instantiateConfigSchemaTypeMapper();
        return ConfigSchemaTypeWriter;
    }

    private static ObjectReader ConfigSchemaReader;
    private static ObjectWriter ConfigSchemaWriter;

    private static void instantiateConfigSchemaMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        ConfigSchemaReader = mapper.readerFor(ConfigSchema.class);
        ConfigSchemaWriter = mapper.writerFor(ConfigSchema.class);
    }

    private static ObjectReader getConfigSchemaObjectReader() {
        if (ConfigSchemaReader == null) instantiateConfigSchemaMapper();
        return ConfigSchemaReader;
    }

    private static ObjectWriter getConfigSchemaObjectWriter() {
        if (ConfigSchemaWriter == null) instantiateConfigSchemaMapper();
        return ConfigSchemaWriter;
    }

    private static ObjectReader ConfigSchemaContentsValueReader;
    private static ObjectWriter ConfigSchemaContentsValueWriter;

    private static void instantiateConfigSchemaContentsValueMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        ConfigSchemaContentsValueReader = mapper.readerFor(ConfigSchemaContents.class);
        ConfigSchemaContentsValueWriter = mapper.writerFor(ConfigSchemaContents.class);
    }

    private static ObjectReader getConfigSchemaContentsValueObjectReader() {
        if (ConfigSchemaContentsValueReader == null) instantiateConfigSchemaContentsValueMapper();
        return ConfigSchemaContentsValueReader;
    }

    private static ObjectWriter getConfigSchemaContentsValueObjectWriter() {
        if (ConfigSchemaContentsValueWriter == null) instantiateConfigSchemaContentsValueMapper();
        return ConfigSchemaContentsValueWriter;
    }

    private static ObjectReader ConfigSchemaContentsReader;
    private static ObjectWriter ConfigSchemaContentsWriter;

    private static void instantiateConfigSchemaContentsMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        ConfigSchemaContentsReader = mapper.readerFor(Map.class);
        ConfigSchemaContentsWriter = mapper.writerFor(Map.class);
    }

    private static ObjectReader getConfigSchemaContentsObjectReader() {
        if (ConfigSchemaContentsReader == null) instantiateConfigSchemaContentsMapper();
        return ConfigSchemaContentsReader;
    }

    private static ObjectWriter getConfigSchemaContentsObjectWriter() {
        if (ConfigSchemaContentsWriter == null) instantiateConfigSchemaContentsMapper();
        return ConfigSchemaContentsWriter;
    }

    private static ObjectReader ConfigSetReader;
    private static ObjectWriter ConfigSetWriter;

    private static void instantiateConfigSetMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        ConfigSetReader = mapper.readerFor(ConfigSet.class);
        ConfigSetWriter = mapper.writerFor(ConfigSet.class);
    }

    private static ObjectReader getConfigSetObjectReader() {
        if (ConfigSetReader == null) instantiateConfigSetMapper();
        return ConfigSetReader;
    }

    private static ObjectWriter getConfigSetObjectWriter() {
        if (ConfigSetWriter == null) instantiateConfigSetMapper();
        return ConfigSetWriter;
    }

    private static ObjectReader ConfigStoreReader;
    private static ObjectWriter ConfigStoreWriter;

    private static void instantiateConfigStoreMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        ConfigStoreReader = mapper.readerFor(ConfigStore.class);
        ConfigStoreWriter = mapper.writerFor(ConfigStore.class);
    }

    private static ObjectReader getConfigStoreObjectReader() {
        if (ConfigStoreReader == null) instantiateConfigStoreMapper();
        return ConfigStoreReader;
    }

    private static ObjectWriter getConfigStoreObjectWriter() {
        if (ConfigStoreWriter == null) instantiateConfigStoreMapper();
        return ConfigStoreWriter;
    }

    private static ObjectReader ConfigStoreQueryReader;
    private static ObjectWriter ConfigStoreQueryWriter;

    private static void instantiateConfigStoreQueryMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        ConfigStoreQueryReader = mapper.readerFor(ConfigStoreQuery.class);
        ConfigStoreQueryWriter = mapper.writerFor(ConfigStoreQuery.class);
    }

    private static ObjectReader getConfigStoreQueryObjectReader() {
        if (ConfigStoreQueryReader == null) instantiateConfigStoreQueryMapper();
        return ConfigStoreQueryReader;
    }

    private static ObjectWriter getConfigStoreQueryObjectWriter() {
        if (ConfigStoreQueryWriter == null) instantiateConfigStoreQueryMapper();
        return ConfigStoreQueryWriter;
    }

    private static ObjectReader ConfigStoreContentsElementReader;
    private static ObjectWriter ConfigStoreContentsElementWriter;

    private static void instantiateConfigStoreContentsElementMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        ConfigStoreContentsElementReader = mapper.readerFor(ConfigStoreContents.class);
        ConfigStoreContentsElementWriter = mapper.writerFor(ConfigStoreContents.class);
    }

    private static ObjectReader getConfigStoreContentsElementObjectReader() {
        if (ConfigStoreContentsElementReader == null) instantiateConfigStoreContentsElementMapper();
        return ConfigStoreContentsElementReader;
    }

    private static ObjectWriter getConfigStoreContentsElementObjectWriter() {
        if (ConfigStoreContentsElementWriter == null) instantiateConfigStoreContentsElementMapper();
        return ConfigStoreContentsElementWriter;
    }

    private static ObjectReader ConfigStoreContentsReader;
    private static ObjectWriter ConfigStoreContentsWriter;

    private static void instantiateConfigStoreContentsMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules();
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
        SimpleModule module = new SimpleModule();
        module.addDeserializer(OffsetDateTime.class, new JsonDeserializer<OffsetDateTime>() {
            @Override
            public OffsetDateTime deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException, JsonProcessingException {
                String value = jsonParser.getText();
                return Converter.parseDateTimeString(value);
            }
        });
        mapper.registerModule(module);
        ConfigStoreContentsReader = mapper.readerFor(List.class);
        ConfigStoreContentsWriter = mapper.writerFor(List.class);
    }

    private static ObjectReader getConfigStoreContentsObjectReader() {
        if (ConfigStoreContentsReader == null) instantiateConfigStoreContentsMapper();
        return ConfigStoreContentsReader;
    }

    private static ObjectWriter getConfigStoreContentsObjectWriter() {
        if (ConfigStoreContentsWriter == null) instantiateConfigStoreContentsMapper();
        return ConfigStoreContentsWriter;
    }
}
