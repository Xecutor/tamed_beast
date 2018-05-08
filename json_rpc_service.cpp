#include "json_rpc_service.hpp"
#include <rapidjson/filereadstream.h>
#include <fmt/format.h>

bool json_rpc_method_params::getBool(const char* name) const
{
    auto member = m_params.FindMember(name);
    if (member == m_params.MemberEnd() || !member->value.IsBool()) {
        throw json_rpc_exception(json_rpc_error::invalid_params, name);
    }
    return member->value.GetBool();
}

bool json_rpc_method_params::getBoolDefault(const char* name, bool defaultValue) const
{
    auto member = m_params.FindMember(name);
    if (member == m_params.MemberEnd()) {
        if (!member->value.IsBool()) {
            throw json_rpc_exception(json_rpc_error::invalid_params, name);
        }
        return defaultValue;
    }
    return member->value.GetBool();
}

int json_rpc_method_params::getInt(const char* name) const
{
    auto member = m_params.FindMember(name);
    if (member == m_params.MemberEnd() || !member->value.IsInt()) {
        throw json_rpc_exception(json_rpc_error::invalid_params, name);
    }
    return member->value.GetInt();
}

int json_rpc_method_params::getIntDefault(const char* name, int defaultValue) const
{
    auto member = m_params.FindMember(name);
    if (member == m_params.MemberEnd()) {
        if (!member->value.IsInt()) {
            throw json_rpc_exception(json_rpc_error::invalid_params, name);
        }
        return defaultValue;
    }
    return member->value.GetInt();
}

const char* json_rpc_method_params::getString(const char* name) const
{
    auto member = m_params.FindMember(name);
    if (member == m_params.MemberEnd() || !member->value.IsString()) {
        throw json_rpc_exception(json_rpc_error::invalid_params, name);
    }
    return member->value.GetString();
}

const char* json_rpc_method_params::getStringDefault(const char* name, const char* defaultValue) const
{
    auto member = m_params.FindMember(name);
    if (member == m_params.MemberEnd()) {
        if (!member->value.IsString()) {
            throw json_rpc_exception(json_rpc_error::invalid_params, name);
        }
        return defaultValue;
    }
    return member->value.GetString();
}

rapidjson::Value::ConstArray json_rpc_method_params::getArray(const char* name, rapidjson::Type expectedType)
{
    auto member = m_params.FindMember(name);
    if (member == m_params.MemberEnd() || !member->value.IsArray()) {
        throw json_rpc_exception(json_rpc_error::invalid_params, name);
    }
    if (expectedType != rapidjson::kNullType) {
        for(auto& v:member->value.GetArray()) {
            if(v.GetType()!=expectedType) {
                throw json_rpc_exception(json_rpc_error::invalid_params, name);
            }
        }
    }
    return member->value.GetArray();
}

rapidjson::Value::ConstObject json_rpc_method_params::getObject(const char* name)
{
    auto member = m_params.FindMember(name);
    if (member == m_params.MemberEnd() || !member->value.IsArray()) {
        throw json_rpc_exception(json_rpc_error::invalid_params, name);
    }
    return member->value.GetObject();
}

json_rpc_service::json_rpc_service(const boost::filesystem::path& data_path):m_data_path(data_path)
{
    init();
}


json_rpc_result json_rpc_service::callMethod(const char* methodName, const json_rpc_method_params& params)const
{
    auto it = m_methods.find(methodName);
    if (it == m_methods.end()) {
        throw json_rpc_exception(json_rpc_error::method_not_found, methodName);
    }
    return it->second.method(params);
}

void json_rpc_service::init()
{
    registerMethod("get_db_list",[this](const json_rpc_method_params& params){return get_db_list_method(params);});
    registerMethod("select",[this](const json_rpc_method_params& params){return select_method(params);});
    registerMethod("insert",[this](const json_rpc_method_params& params){return insert_method(params);});
    registerMethod("update",[this](const json_rpc_method_params& params){return update_method(params);});
    registerMethod("delete",[this](const json_rpc_method_params& params){return delete_method(params);});

    prepare_db_map();
}

void json_rpc_service::prepare_db_map()
{
    rapidjson::Document dbs;
    load_json_file("database.json", dbs);
    for (auto& db : dbs.GetArray()) {
        json_rpc_method_params dbparam(db);
        std::string dbName = dbparam.getString("TableName");
        std::vector<std::string> files;
        for (auto& file : dbparam.getArray("JSON")) {
            json_rpc_method_params fileparam(file);
            files.push_back(fileparam.getString("File"));
        }
        m_dbmap.emplace(std::move(dbName), std::move(files));
    }
}

void json_rpc_service::load_json_file(const std::string& filename, rapidjson::Document& doc)
{
    auto path = m_data_path / filename;
    FILE* f = fopen(path.string().c_str(), "rb");
    if (!f) {
        throw json_rpc_exception(json_rpc_error::file_open_error, path.string().c_str());
    }
    std::unique_ptr<FILE, decltype(&fclose)> fguard(f, &fclose);
    char buf[4096];
    rapidjson::FileReadStream ss(f, buf, sizeof(buf));
    doc.ParseStream<rapidjson::kParseCommentsFlag|rapidjson::kParseTrailingCommasFlag>(ss);
    if(doc.HasParseError()) {
        throw json_rpc_exception(json_rpc_error::file_parse_error, fmt::format("Fike '{}', error at offset {}", filename, doc.GetErrorOffset()));
    }
}


void json_rpc_service::registerMethod(const char* name, method_type function)
{
    m_methods.emplace(name, method_record{function});
}

json_rpc_result json_rpc_service::get_db_list_method(const json_rpc_method_params& params)
{
    json_rpc_result result;
    load_json_file("database.json", result.get_document());
    return result;
}

json_rpc_result json_rpc_service::select_method(const json_rpc_method_params& params)
{
    auto tablename = params.getString("table");
    auto it = m_dbmap.find(tablename);
    if(it==m_dbmap.end()) {
        throw json_rpc_exception(json_rpc_error::table_not_found, tablename);
    }
    json_rpc_result result;
    result.get_document().SetArray();
    auto& a = result.get_document().GetAllocator();
    for(auto& file:it->second) {
        rapidjson::Document tbl(&a);
        load_json_file(file, tbl);
        result.get_document().GetArray().Reserve(result.get_document().GetArray().Size() + tbl.GetArray().Size(), a);
        for(auto& item:tbl.GetArray()) {
            //rapidjson::Value itemCopy(item, result.get_document().GetAllocator());
            item.AddMember("_filename", file, result.get_document().GetAllocator());
            result.push_back(std::move(item));
        }
    }
    return result;
}

json_rpc_result json_rpc_service::insert_method(const json_rpc_method_params& params)
{
    return {};
}

json_rpc_result json_rpc_service::update_method(const json_rpc_method_params& params)
{
    return {};
}

json_rpc_result json_rpc_service::delete_method(const json_rpc_method_params& params)
{
    return {};
}
