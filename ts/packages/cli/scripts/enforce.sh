# todo: make it work with the TestCommand etc..

# import subprocess


# def run(command_line: str) -> str:
#     proc = subprocess.Popen(command_line, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
#     (out, err) = proc.communicate()

#     if out:
#         return out.decode('ascii').strip()
#     if err:
#         return err.decode('ascii').strip()
#     return 'Error running command line'


# if __name__ == '__main__':
#     EXPORT_CMD = "configu export --from 'store=configu;set=dev/{username};schema=./env.cfgu.json'"

#     if not run("configu --version").startswith('@configu'):
#         print('Please install configu: https://configu.com/docs/cli-setup/#install-with-script')
#     elif 'Error' in run(EXPORT_CMD):
#         print('Please login to Configu using: configu store upsert --type "configu"')
#     else:
#         run(f'{EXPORT_CMD} --template-input=array --template=./env.tmpl > ../.env2')
