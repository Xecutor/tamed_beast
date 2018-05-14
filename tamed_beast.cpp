#include <stdio.h>
#include "web_server.hpp"
#include "json_rpc_service.hpp"

#include <boost/filesystem.hpp>

#include <rapidjson/document.h>
#include <rapidjson/stringbuffer.h>
#include <rapidjson/writer.h>

class tamed_best_app{
public:
};

void tile_file_handler(const std::string& tilesPath, const std::string& request, http_responder& responder)
        {
    boost::filesystem::path fullPath = tilesPath;
    boost::filesystem::path relativePath = request;
    fullPath /= relativePath.leaf();
    if (!boost::filesystem::exists(fullPath)) {
        responder.respondWithNotFound();
        return;
    }
    responder.respondWithFile(fullPath.string());
}

void json_rpc_handler(const json_rpc_service& svc, const std::string& request, ws_responder& responder)
{
    rapidjson::Document req;
    rapidjson::StringStream ss(request.c_str());
    req.ParseStream(ss);

    auto errorHandler = [&responder, &req](int code, const char* message) {
        rapidjson::Document resp(rapidjson::kObjectType);

        auto id = req.FindMember("id");
        if(id!=req.MemberEnd()) {
            resp.AddMember("id", id->value.GetInt(), resp.GetAllocator());
        }
        resp.AddMember("jsonrpc", "2.0", resp.GetAllocator());
        auto& error = resp.AddMember("error", rapidjson::kObjectType, resp.GetAllocator());
        error.AddMember("code", code, resp.GetAllocator());
        rapidjson::Value v(message, resp.GetAllocator());
        error.AddMember("message", rapidjson::Value(message, resp.GetAllocator()), resp.GetAllocator());

        rapidjson::StringBuffer sbuf;
        rapidjson::Writer<rapidjson::StringBuffer> writer(sbuf);
        resp.Accept(writer);

        responder.respond(sbuf.GetString());
    };

    try{
        if (req.HasParseError()) {
            throw json_rpc_exception(json_rpc_error::parse_error, "Parse error");
        }
        auto method = req.FindMember("method");
        auto params = req.FindMember("params");
        auto id = req.FindMember("id");
        if (method == req.MemberEnd() ||
            params == req.MemberEnd() ||
            id == req.MemberEnd() ||
            !method->value.IsString() ||
            !id->value.IsInt()) {
            throw json_rpc_exception(json_rpc_error::invalid_request, "Invalid method format");
        }
        json_rpc_method_params mparams(params->value);
        auto result = svc.callMethod(method->value.GetString(), mparams);

        rapidjson::Document resp(rapidjson::kObjectType);

        resp.AddMember("id", id->value.GetInt(), resp.GetAllocator());
        resp.AddMember("jsonrpc", "2.0", resp.GetAllocator());
        rapidjson::Value res(result.get_document(), resp.GetAllocator());

        resp.AddMember("result", res, resp.GetAllocator());

        rapidjson::StringBuffer sbuf;
        rapidjson::Writer<rapidjson::StringBuffer> writer(sbuf);
        resp.Accept(writer);

        responder.respond(sbuf.GetString());

    }catch(json_rpc_exception& e)
    {
        errorHandler(e.get_error(), e.what());
    }catch(std::exception& e)
    {
        errorHandler(static_cast<int>(json_rpc_error::internal_error), e.what());
    }

}

int main(int argc, char* argv[])
{
    try {
        web_server::config config;
        config.address="127.0.0.1";
        config.port=18759;
        config.webroot="webroot";
        web_server web(1);
        web.init(config);

        const std::string& ingnomiaRoot = argc==1?"D:/Games2/steamapps/common/Ingnomia/" : argv[1];

        const std::string& tilesPath=ingnomiaRoot + "content/tilesheet";
        const std::string& dataPath=ingnomiaRoot + "content/JSON";

        json_rpc_service jsonrpc_svc(dataPath);

        web.registerHttpHandler("/tilesheet/", std::bind(tile_file_handler, tilesPath, std::placeholders::_1, std::placeholders::_2));
        web.registerWsHandler("/json_ws", std::bind(json_rpc_handler, jsonrpc_svc, std::placeholders::_1, std::placeholders::_2));

        web.run();
        web.shutdown();
        return EXIT_SUCCESS;
    } catch (std::exception& e) {
        fprintf(stderr, "Exception: %s\n", e.what());
        return EXIT_FAILURE;
    }
}
